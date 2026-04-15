import { supabaseAdminTable } from "@/lib/supabase/rest";

export type AuctionAction = "start" | "set_drawing" | "draw_next" | "open_selection" | "pick" | "next" | "reset" | "close";

interface SessionRow {
  id: string;
  tournament_id: string;
  state: string;
  current_player_id: string | null;
  current_captain_turn: number;
  announcer_line: string | null;
  is_active: boolean;
}

interface PoolRow {
  player_id: string;
  is_available: boolean;
  draw_order: number | null;
  auction_players: { id: string; name: string; role: string; region: string; style: string; sold_to_captain_id: string | null };
}

export async function getActiveSession() {
  const rows = await supabaseAdminTable<SessionRow[]>("auction_sessions?select=*&is_active=eq.true&limit=1");
  return rows[0] ?? null;
}

export async function getAuctionSnapshot() {
  const session = await getActiveSession();
  if (!session) return null;

  const [pool, teams, rounds] = await Promise.all([
    supabaseAdminTable<PoolRow[]>(`auction_pool?select=player_id,is_available,draw_order,auction_players(id,name,role,region,style,sold_to_captain_id)&session_id=eq.${session.id}&order=draw_order.asc.nullslast`),
    supabaseAdminTable<any[]>(`teams?select=id,name,captain_id,team_players(player_id)&tournament_id=eq.${session.tournament_id}`),
    supabaseAdminTable<any[]>(`auction_rounds?select=id,player_id,captain_id,state,created_at,auction_players(name)&session_id=eq.${session.id}&order=created_at.desc`)
  ]);

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
    history: rounds.map((r) => ({ id: r.id, playerId: r.player_id, playerName: r.auction_players?.name, captainId: r.captain_id, state: r.state, createdAt: r.created_at }))
  };
}

async function patchSession(sessionId: string, payload: Record<string, unknown>) {
  await supabaseAdminTable(`auction_sessions?id=eq.${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function runAuctionAction(action: AuctionAction, captainId?: string, manualPlayerId?: string) {
  const session = await getActiveSession();
  if (!session) throw new Error("No active auction session");

  if (action === "start") {
    await patchSession(session.id, { state: "waiting", announcer_line: "Auction started. Ready for lot draw." });
  }

  if (action === "set_drawing") {
    await patchSession(session.id, { state: "drawing", announcer_line: "Next player entering the auction pool..." });
  }

  if (action === "draw_next") {
    const available = await supabaseAdminTable<PoolRow[]>(`auction_pool?select=player_id,auction_players(id,name,role,region,style)&session_id=eq.${session.id}&is_available=eq.true`);
    if (!available.length) {
      await patchSession(session.id, { state: "complete", announcer_line: "All players have entered the auction." });
      return;
    }

    const chosen = manualPlayerId ? available.find((row) => row.player_id === manualPlayerId) : available[Math.floor(Math.random() * available.length)];
    if (!chosen) throw new Error("Chosen player is not available in pot");

    await supabaseAdminTable(`auction_pool?session_id=eq.${session.id}&player_id=eq.${chosen.player_id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_available: false, draw_order: Date.now() })
    });

    await patchSession(session.id, {
      state: "player_reveal",
      current_player_id: chosen.player_id,
      announcer_line: `Draw complete. ${chosen.auction_players.name} enters the auction.`
    });
  }

  if (action === "open_selection") {
    await patchSession(session.id, { state: "selection", announcer_line: "Captains, prepare for the next selection." });
  }

  if (action === "pick") {
    if (!captainId) throw new Error("captainId is required for pick");
    if (!session.current_player_id) throw new Error("No active player revealed");

    const teams = await supabaseAdminTable<any[]>(`teams?select=id,captain_id&tournament_id=eq.${session.tournament_id}`);
    const team = teams.find((t) => t.captain_id === captainId);
    if (!team) throw new Error("Captain team not found");

    await supabaseAdminTable("team_players", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify([{ team_id: team.id, player_id: session.current_player_id }])
    });

    await supabaseAdminTable(`auction_players?id=eq.${session.current_player_id}`, {
      method: "PATCH",
      body: JSON.stringify({ sold_to_captain_id: captainId })
    });

    await supabaseAdminTable("auction_rounds", {
      method: "POST",
      body: JSON.stringify([
        {
          id: crypto.randomUUID(),
          session_id: session.id,
          player_id: session.current_player_id,
          captain_id: captainId,
          state: "sold"
        }
      ])
    });

    await patchSession(session.id, {
      state: "sold",
      announcer_line: "Player sold. Awaiting next lot draw.",
      current_player_id: null,
      current_captain_turn: session.current_captain_turn + 1
    });
  }

  if (action === "next") {
    const remaining = await supabaseAdminTable<any[]>(`auction_pool?select=player_id&session_id=eq.${session.id}&is_available=eq.true`);
    await patchSession(session.id, {
      state: remaining.length ? "waiting" : "complete",
      announcer_line: remaining.length ? "Ready for next lot draw." : "Auction complete.",
      current_player_id: null
    });
  }

  if (action === "reset") {
    await Promise.all([
      supabaseAdminTable(`auction_pool?session_id=eq.${session.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_available: true, draw_order: null })
      }),
      supabaseAdminTable(`auction_players?sold_to_captain_id=not.is.null`, {
        method: "PATCH",
        body: JSON.stringify({ sold_to_captain_id: null })
      }),
      supabaseAdminTable(`team_players?team_id=not.is.null`, { method: "DELETE" }),
      supabaseAdminTable(`auction_rounds?session_id=eq.${session.id}`, { method: "DELETE" })
    ]);

    await patchSession(session.id, { state: "waiting", current_player_id: null, announcer_line: "Auction reset complete.", current_captain_turn: 0 });
  }

  if (action === "close") {
    await patchSession(session.id, { state: "complete", is_active: false, announcer_line: "Auction closed by admin." });
  }
}
