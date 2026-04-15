"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJSON } from "@/lib/services/http";
import { AuctionPlayer, Captain, Team } from "@/lib/types/models";

interface AuctionRuntime {
  state: "waiting_draw" | "drawing" | "player_revealed" | "in_auction" | "auction_complete_for_player" | "complete";
  currentPlayer?: AuctionPlayer;
  currentCaptainTurnIndex: number;
  teams: Team[];
  pot: AuctionPlayer[];
  announcerLine: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function AuctionStagePanel() {
  const [runtime, setRuntime] = useState<AuctionRuntime | null>(null);
  const [captains, setCaptains] = useState<Captain[]>([]);
  const [playerMap, setPlayerMap] = useState<Record<string, string>>({});
  const [manualPlayerId, setManualPlayerId] = useState<string>("");
  const [drawing, setDrawing] = useState(false);

  const load = () => {
    fetchJSON<AuctionRuntime>("/api/auction/state").then((res) => {
      setRuntime(res);
      if (res.pot.length && !manualPlayerId) setManualPlayerId(res.pot[0].id);
    });
    fetchJSON<{ captains: Captain[] }>("/api/captains").then((d) => setCaptains(d.captains));
    fetchJSON<{ players: AuctionPlayer[] }>("/api/players").then((d) =>
      setPlayerMap(Object.fromEntries(d.players.map((p) => [p.id, p.name])))
    );
  };

  useEffect(() => {
    load();
  }, []);

  const turnCaptain = runtime ? captains[runtime.currentCaptainTurnIndex] : undefined;

  const statusText = useMemo(() => {
    if (!runtime) return "Loading auction lot system...";
    switch (runtime.state) {
      case "waiting_draw":
        return "Waiting for draw";
      case "drawing":
        return "Drawing next lot";
      case "player_revealed":
        return "Player revealed";
      case "in_auction":
        return `In auction · ${turnCaptain?.name ?? "Captain turn"}`;
      case "auction_complete_for_player":
        return "Auction complete for player";
      default:
        return "Auction lot draw complete";
    }
  }, [runtime, turnCaptain?.name]);

  const act = async (action: string, captainId?: string, manualId?: string) => {
    await fetchJSON("/api/auction/state", {
      method: "POST",
      body: JSON.stringify({ action, captainId, manualPlayerId: manualId })
    });
    load();
  };

  const drawNext = async () => {
    if (!runtime || runtime.pot.length === 0 || drawing) return;
    setDrawing(true);
    await act("set_drawing");
    await sleep(1600);
    await act("draw_next");
    setDrawing(false);
  };

  const drawManual = async () => {
    if (!manualPlayerId || drawing) return;
    setDrawing(true);
    await act("set_drawing");
    await sleep(900);
    await act("draw_next", undefined, manualPlayerId);
    setDrawing(false);
  };

  return (
    <section className="space-y-5">
      <div className="event-panel p-5 sm:p-6">
        <p className="eyebrow">Auction Lot Draw System</p>
        <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">{statusText}</h2>
        <p className="mt-3 text-sm uppercase tracking-[0.14em] text-white/60">{runtime?.announcerLine ?? "Preparing lot draw..."}</p>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="border border-white/15 bg-black/40 p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-white/55">Player Spotlight</p>

            {drawing || runtime?.state === "drawing" ? (
              <div className="mt-4 border border-neon/40 bg-neon/5 p-5 text-center">
                <p className="animate-pulse text-xs uppercase tracking-[0.24em] text-neon">Drawing next player...</p>
                <p className="mt-3 text-3xl font-black uppercase tracking-[0.08em] sm:text-5xl">LOT IN PROGRESS</p>
              </div>
            ) : runtime?.currentPlayer ? (
              <div className="mt-4 border border-white/20 bg-white/[0.02] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-neon">Now entering auction</p>
                <h3 className="mt-3 text-3xl font-black uppercase leading-tight sm:text-4xl">{runtime.currentPlayer.name}</h3>
                <div className="mt-4 grid gap-2 text-xs uppercase tracking-[0.16em] text-white/65 sm:grid-cols-3">
                  <p>Role · {runtime.currentPlayer.role}</p>
                  <p>Region · {runtime.currentPlayer.region}</p>
                  <p>Style · {runtime.currentPlayer.style}</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-white/70">No player revealed yet. Draw from the pot to begin.</p>
            )}
          </div>

          <div className="border border-white/15 bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/60">Remaining in pot</p>
            <p className="mt-2 text-3xl font-black text-neon">{runtime?.pot.length ?? 0}</p>

            <ul className="mt-4 max-h-48 space-y-2 overflow-auto border-t border-white/10 pt-3 text-sm text-white/80">
              {runtime?.pot?.length ? (
                runtime.pot.map((p) => (
                  <li key={p.id} className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span>{p.name}</span>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-white/45">{p.role}</span>
                  </li>
                ))
              ) : (
                <li className="text-white/60">Pot empty</li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button className="cta-primary" onClick={drawNext} disabled={drawing || !runtime?.pot.length || runtime?.state === "in_auction"}>
            Draw Next Player
          </button>

          <button
            className="cta-ghost"
            onClick={() => act("open_selection")}
            disabled={runtime?.state !== "player_revealed"}
          >
            Start Auction for Player
          </button>

          <button className="cta-ghost" onClick={() => act("next")} disabled={runtime?.state !== "auction_complete_for_player"}>
            Move to Next Lot
          </button>

          <button className="cta-ghost" onClick={() => act("close_without_pick")} disabled={runtime?.state !== "in_auction"}>
            Close Without Pick
          </button>

          <button className="border border-danger/40 bg-danger/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em]" onClick={() => act("reset")}>
            Reset Pot
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-white/10 pt-4">
          <label className="text-xs uppercase tracking-[0.16em] text-white/55">Manual override</label>
          <select
            className="min-w-52 border border-white/20 bg-black/50 px-3 py-2 text-sm"
            value={manualPlayerId}
            onChange={(e) => setManualPlayerId(e.target.value)}
          >
            {runtime?.pot.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button className="cta-ghost" onClick={drawManual} disabled={!runtime?.pot.length || runtime?.state === "in_auction"}>
            Draw Selected Player
          </button>
        </div>

        {runtime?.state === "in_auction" && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Captain picks</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {captains.map((c) => (
                <button key={c.id} className="border border-white/20 bg-white/5 px-3 py-2 text-sm" onClick={() => act("pick", c.id)}>
                  Pick: {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {runtime?.teams?.map((team) => (
          <div className="card p-4" key={team.id}>
            <h3 className="font-semibold uppercase tracking-[0.08em]">{team.name}</h3>
            <ul className="mt-2 space-y-1 text-sm text-white/80">
              {team.playerIds.length
                ? team.playerIds.map((id) => <li key={id}>• {playerMap[id] ?? "Unknown Player"}</li>)
                : <li>No picks yet</li>}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
