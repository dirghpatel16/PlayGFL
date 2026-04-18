import { supabaseAdminTable } from "@/lib/supabase/rest";

export type AuctionAction = "start" | "draw_next" | "open_bidding" | "bid" | "hammer" | "pick" | "next" | "reset" | "close";

const BID_WINDOW_MS = 15_000; // 15 seconds per strike window
const MAX_TEAM_PLAYERS = 3;   // captain + 3 picks = 4 total

interface SessionRow {
  id: string;
  tournament_id: string;
  state: string;
  current_player_id: string | null;
  current_captain_turn: number;
  announcer_line: string | null;
  is_active: boolean;
  current_bid_amount: number;
  current_bid_captain_id: string | null;
  strike_count: number;
  bid_deadline: string | null;
}

interface PoolRow {
  player_id: string;
  is_available: boolean;
  draw_order: number | null;
  auction_players: { id: string; name: string; role: string; region: string; style: string; sold_to_captain_id: string | null };
}

export async function getActiveSession(): Promise<SessionRow | null> {
  const rows = await supabaseAdminTable<SessionRow[]>("auction_sessions?is_active=eq.true&select=*&limit=1");
  return rows[0] ?? null;
}

async function patchSession(sessionId: string, payload: Record<string, unknown>) {
  await supabaseAdminTable(`auction_sessions?id=eq.${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

async function processSale(session: SessionRow) {
  if (!session.current_player_id || !session.current_bid_captain_id) return;

  const teams = await supabaseAdminTable<any[]>(`teams?tournament_id=eq.${session.tournament_id}&select=id,captain_id`);
  const team = teams.find((t) => t.captain_id === session.current_bid_captain_id);
  if (!team) return;

  const captain = await supabaseAdminTable<any[]>(`captains?id=eq.${session.current_bid_captain_id}&select=purse_points`);
  const purse = captain[0]?.purse_points ?? 0;
  const spent = session.current_bid_amount;

  await Promise.all([
    supabaseAdminTable("team_players", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify([{ team_id: team.id, player_id: session.current_player_id }])
    }),
    supabaseAdminTable(`auction_players?id=eq.${session.current_player_id}`, {
      method: "PATCH",
      body: JSON.stringify({ sold_to_captain_id: session.current_bid_captain_id })
    }),
    supabaseAdminTable("auction_rounds", {
      method: "POST",
      body: JSON.stringify([{
        id: crypto.randomUUID(),
        session_id: session.id,
        player_id: session.current_player_id,
        captain_id: session.current_bid_captain_id,
        state: "sold"
      }])
    }),
    supabaseAdminTable(`captains?id=eq.${session.current_bid_captain_id}`, {
      method: "PATCH",
      body: JSON.stringify({ purse_points: Math.max(0, purse - spent) })
    })
  ]);

  await patchSession(session.id, {
    state: "sold",
    strike_count: 3,
    bid_deadline: null,
    current_player_id: null,
    current_captain_turn: session.current_captain_turn + 1,
    announcer_line: `🔨 SOLD for ₹${spent}! Captain picks up the player.`
  });
}

export async function getAuctionSnapshot() {
  let session = await getActiveSession();
  if (!session) return null;

  const [pool, teams, rounds, captains, allPlayers] = await Promise.all([
    supabaseAdminTable<PoolRow[]>(`auction_pool?session_id=eq.${session.id}&select=player_id,is_available,draw_order,auction_players(id,name,role,region,style,sold_to_captain_id)&order=draw_order.asc.nullslast`),
    supabaseAdminTable<any[]>(`teams?tournament_id=eq.${session.tournament_id}&select=id,name,captain_id,team_players(player_id)`),
    supabaseAdminTable<any[]>(`auction_rounds?session_id=eq.${session.id}&select=id,player_id,captain_id,state,created_at,auction_players(name)&order=created_at.desc`),
    supabaseAdminTable<any[]>("captains?select=id,name,tag,purse_points"),
    supabaseAdminTable<any[]>("auction_players?select=id")
  ]);

  // Auto-sync any new registered players into the auction pool
  const existingPlayerIds = new Set(pool.map(p => p.player_id));
  const newPlayers = allPlayers.filter(p => !existingPlayerIds.has(p.id));
  if (newPlayers.length > 0) {
    await supabaseAdminTable("auction_pool", {
      method: "POST",
      body: JSON.stringify(newPlayers.map(p => ({ session_id: session!.id, player_id: p.id, is_available: true })))
    }).catch(() => null);
    // Refresh pool to include newly inserted
    const newPoolData = await supabaseAdminTable<PoolRow[]>(`auction_pool?session_id=eq.${session.id}&select=player_id,is_available,draw_order,auction_players(id,name,role,region,style,sold_to_captain_id)&order=draw_order.asc.nullslast`);
    pool.splice(0, pool.length, ...newPoolData);
  }

  const currentPlayer = pool.find((p) => p.player_id === session.current_player_id)?.auction_players;

  return {
    id: session.id,
    state: session.state,
    currentCaptainTurnIndex: session.current_captain_turn,
    announcerLine: session.announcer_line ?? "Auction control ready",
    currentPlayer,
    pot: pool.filter((p) => p.is_available).map((p) => p.auction_players),
    teams: teams.map((t) => ({
      id: t.id,
      name: t.name,
      captainId: t.captain_id,
      playerIds: (t.team_players ?? []).map((tp: { player_id: string }) => tp.player_id)
    })),
    history: rounds.map((r) => ({ id: r.id, playerId: r.player_id, playerName: r.auction_players?.name, captainId: r.captain_id, state: r.state, createdAt: r.created_at })),
    captains,
    currentBidAmount: session.current_bid_amount,
    currentBidCaptainId: session.current_bid_captain_id,
    strikeCount: session.strike_count,
    bidDeadline: session.bid_deadline
  };
}

export async function runAuctionAction(action: AuctionAction, captainId?: string, manualPlayerId?: string, bidAmount?: number) {
  let session = await getActiveSession();

  // --- START ---
  if (action === "start") {
    if (!session) {
      const rows = await supabaseAdminTable<any[]>("auction_sessions", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify([{
          tournament_id: "gfl-s2",
          state: "waiting",
          announcer_line: "Auction started. Ready for lot draw.",
          current_bid_amount: 1,
          strike_count: 0
        }])
      });
      session = rows[0];
      if (session) {
        const players = await supabaseAdminTable<any[]>("auction_players?select=id");
        if (players.length > 0) {
          await supabaseAdminTable("auction_pool", {
            method: "POST",
            body: JSON.stringify(players.map(p => ({ session_id: session!.id, player_id: p.id, is_available: true })))
          }).catch(() => null);
        }
      }
    } else {
      await patchSession(session.id, { state: "waiting", announcer_line: "Auction ready." });
    }
    return;
  }

  if (!session) throw new Error("No active auction session");

  // --- DRAW NEXT ---
  if (action === "draw_next") {
    const available = await supabaseAdminTable<PoolRow[]>(`auction_pool?session_id=eq.${session.id}&is_available=eq.true&select=player_id,auction_players(id,name,role,region,style)`);
    if (!available.length) {
      await patchSession(session.id, { state: "complete", announcer_line: "All players have been auctioned." });
      return;
    }
    const chosen = manualPlayerId ? available.find((r) => r.player_id === manualPlayerId) : available[Math.floor(Math.random() * available.length)];
    if (!chosen) throw new Error("Player not available in pot");

    await supabaseAdminTable(`auction_pool?session_id=eq.${session.id}&player_id=eq.${chosen.player_id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_available: false, draw_order: Date.now(), drawn_at: new Date().toISOString() })
    });

    await patchSession(session.id, {
      state: "player_reveal",
      current_player_id: chosen.player_id,
      current_bid_amount: 1,
      current_bid_captain_id: null,
      strike_count: 0,
      bid_deadline: null,
      announcer_line: `${chosen.auction_players.name} enters the auction!`
    });
  }

  // --- OPEN BIDDING ---
  if (action === "open_bidding") {
    const basePrice = bidAmount && bidAmount > 0 ? bidAmount : 1;
    await patchSession(session.id, {
      state: "bidding",
      current_bid_amount: basePrice,
      current_bid_captain_id: null,
      strike_count: 0,
      bid_deadline: new Date(Date.now() + BID_WINDOW_MS).toISOString(),
      announcer_line: `Bidding open! Base price ₹${basePrice}. Commissioner is taking bids.`
    });
  }

  // --- BID ---
  if (action === "bid") {
    if (!captainId) throw new Error("captainId required to bid");
    if (!bidAmount || bidAmount <= session.current_bid_amount) {
      throw new Error(`Bid must be higher than current ₹${session.current_bid_amount}`);
    }
    if (session.state !== "bidding") throw new Error("Bidding is not currently open");

    const captains = await supabaseAdminTable<any[]>(`captains?id=eq.${captainId}&select=purse_points,name`);
    const cap = captains[0];
    if (!cap) throw new Error("Captain not found");
    if (bidAmount > cap.purse_points) throw new Error(`₹${bidAmount} exceeds your remaining purse (₹${cap.purse_points})`);

    await patchSession(session.id, {
      current_bid_amount: bidAmount,
      current_bid_captain_id: captainId,
      strike_count: 0,
      bid_deadline: new Date(Date.now() + BID_WINDOW_MS).toISOString(),
      announcer_line: `${cap.name} bids ₹${bidAmount}! Timer reset.`
    });
  }

  // --- HAMMER (manual strike by commissioner) ---
  if (action === "hammer") {
    if (session.state !== "bidding") throw new Error("No active bidding to hammer");

    if (!session.current_bid_captain_id) {
      // No bids — just reset timer
      await patchSession(session.id, {
        bid_deadline: new Date(Date.now() + BID_WINDOW_MS).toISOString(),
        announcer_line: "No bids. Timer extended."
      });
    } else {
      const newStrike = session.strike_count + 1;
      if (newStrike >= 3) {
        await processSale(session);
      } else {
        const msgs = ["🔨 Strike 1! Going once...", "🔨🔨 Strike 2! Going twice..."];
        await patchSession(session.id, {
          strike_count: newStrike,
          bid_deadline: new Date(Date.now() + BID_WINDOW_MS).toISOString(),
          announcer_line: msgs[newStrike - 1]
        });
      }
    }
  }

  // --- MANUAL PICK (override, commissioner) ---
  if (action === "pick") {
    if (!captainId) throw new Error("captainId required for pick");
    if (!session.current_player_id) throw new Error("No active player");

    const teams = await supabaseAdminTable<any[]>(`teams?tournament_id=eq.${session.tournament_id}&select=id,captain_id,team_players(player_id)`);
    const team = teams.find((t) => t.captain_id === captainId);
    if (!team) throw new Error("Captain's team not found");

    const teamSize = (team.team_players ?? []).length;
    if (teamSize >= MAX_TEAM_PLAYERS) throw new Error(`Team full (${MAX_TEAM_PLAYERS} players + captain)`);

    const fakeSess = { ...session, current_bid_captain_id: captainId, current_bid_amount: session.current_bid_amount || 1 };
    await processSale(fakeSess as SessionRow);
  }

  // --- NEXT ROUND ---
  if (action === "next") {
    const remaining = await supabaseAdminTable<any[]>(`auction_pool?session_id=eq.${session.id}&is_available=eq.true&select=player_id`);
    await patchSession(session.id, {
      state: remaining.length ? "waiting" : "complete",
      current_player_id: null,
      current_bid_amount: 1,
      current_bid_captain_id: null,
      strike_count: 0,
      bid_deadline: null,
      announcer_line: remaining.length ? `${remaining.length} player(s) remaining. Ready for next draw.` : "Auction complete! All players sold."
    });
  }

  // --- RESET ---
  if (action === "reset") {
    await Promise.all([
      supabaseAdminTable(`auction_pool?session_id=eq.${session.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_available: true, draw_order: null, drawn_at: null, sold_at: null, sold_to_captain_id: null })
      }),
      supabaseAdminTable(`auction_players?sold_to_captain_id=not.is.null`, {
        method: "PATCH",
        body: JSON.stringify({ sold_to_captain_id: null })
      }),
      supabaseAdminTable(`team_players?team_id=in.(${(await supabaseAdminTable<any[]>(`teams?tournament_id=eq.${session.tournament_id}&select=id`)).map((t: any) => t.id).join(",") || "null"})`, { method: "DELETE" }),
      supabaseAdminTable(`auction_rounds?session_id=eq.${session.id}`, { method: "DELETE" })
    ]).catch(() => null);

    await patchSession(session.id, {
      state: "waiting",
      current_player_id: null,
      current_bid_amount: 1,
      current_bid_captain_id: null,
      strike_count: 0,
      bid_deadline: null,
      current_captain_turn: 0,
      announcer_line: "Auction reset. Ready to start again."
    });
  }

  // --- CLOSE ---
  if (action === "close") {
    await patchSession(session.id, { state: "complete", is_active: false, bid_deadline: null, announcer_line: "Auction closed." });
  }
}
