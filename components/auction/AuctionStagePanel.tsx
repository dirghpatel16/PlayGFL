"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJSON } from "@/lib/services/http";
import { Captain, Team } from "@/lib/types/models";

interface AuctionRuntime {
  state: "waiting" | "drawing" | "player_reveal" | "selection" | "sold" | "complete";
  currentPlayer?: { id: string; name: string; role: string; region: string; style: string };
  currentCaptainTurnIndex: number;
  teams: Team[];
  pot: { id: string; name: string; role: string }[];
  announcerLine: string;
  history: { id: string; playerName?: string; captainId?: string; state: string; createdAt: string }[];
}

export function AuctionStagePanel() {
  const [runtime, setRuntime] = useState<AuctionRuntime | null>(null);
  const [captains, setCaptains] = useState<Captain[]>([]);
  const [error, setError] = useState("");
  const [isCommissioner, setIsCommissioner] = useState(false);

  const load = () => {
    fetchJSON<AuctionRuntime>("/api/auction/state").then(setRuntime).catch((e) => setError(e.message));
    fetchJSON<{ captains: Captain[] }>("/api/captains").then((d) => setCaptains(d.captains)).catch(() => null);
    fetchJSON<{ enabled: boolean }>("/api/commissioner/session").then((d) => setIsCommissioner(d.enabled)).catch(() => setIsCommissioner(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  const turnCaptain = runtime ? captains[runtime.currentCaptainTurnIndex % (captains.length || 1)] : undefined;

  const statusText = useMemo(() => {
    if (!runtime) return "Loading auction state...";
    switch (runtime.state) {
      case "waiting": return "Waiting for draw";
      case "drawing": return "Drawing next lot";
      case "player_reveal": return "Player revealed";
      case "selection": return `Selection open · ${turnCaptain?.name ?? "Captain"}`;
      case "sold": return "Player sold";
      default: return "Auction complete";
    }
  }, [runtime, turnCaptain?.name]);

  const act = async (action: string, captainId?: string, manualPlayerId?: string) => {
    setError("");
    try {
      await fetchJSON("/api/auction/state", {
        method: "POST",
        body: JSON.stringify({ action, captainId, manualPlayerId })
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  };

  return (
    <section className="space-y-5">
      <div className="event-panel p-5 sm:p-6">
        <p className="eyebrow">Auction Lot Draw</p>
        <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">{statusText}</h2>
        <p className="mt-3 text-sm uppercase tracking-[0.14em] text-white/60">{runtime?.announcerLine ?? "Preparing session..."}</p>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="border border-white/15 bg-black/40 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-white/55">Current player spotlight</p>
            {runtime?.currentPlayer ? (
              <div className="mt-3 border border-white/20 bg-white/[0.02] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-neon">Now entering auction</p>
                <h3 className="mt-2 text-3xl font-black uppercase">{runtime.currentPlayer.name}</h3>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-white/60">{runtime.currentPlayer.role} · {runtime.currentPlayer.region}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/60">Style · {runtime.currentPlayer.style}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-white/70">No active player</p>
            )}
          </div>

          <div className="border border-white/15 bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/60">Remaining players in pot</p>
            <p className="mt-2 text-3xl font-black text-neon">{runtime?.pot.length ?? 0}</p>
            <ul className="mt-4 max-h-48 space-y-2 overflow-auto border-t border-white/10 pt-3 text-sm text-white/80">
              {runtime?.pot?.length ? runtime.pot.map((p) => <li key={p.id}>• {p.name}</li>) : <li className="text-white/60">Pot empty</li>}
            </ul>
          </div>
        </div>

        {isCommissioner && <div className="mt-5 flex flex-wrap gap-2">
          <button className="cta-primary" onClick={() => act("start")}>Start Auction</button>
          <button className="cta-ghost" onClick={() => act("set_drawing")}>Start Draw</button>
          <button className="cta-ghost" onClick={() => act("draw_next")}>Draw Next Player</button>
          <button className="cta-ghost" onClick={() => act("open_selection")} disabled={runtime?.state !== "player_reveal"}>Open Selection</button>
          <button className="cta-ghost" onClick={() => act("next")} disabled={runtime?.state !== "sold"}>Proceed Next</button>
          <button className="border border-danger/40 bg-danger/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em]" onClick={() => act("reset")}>Reset</button>
          <button className="border border-white/20 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em]" onClick={() => act("close")}>Close Auction</button>
        </div>}

        {!isCommissioner && <p className="mt-5 text-sm text-white/60">Live viewer mode: commissioner controls are hidden for public users.</p>}

        {isCommissioner && runtime?.state === "selection" && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Assign to captain</p>
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
              {team.playerIds.length ? team.playerIds.map((id) => <li key={id}>• {id}</li>) : <li>No picks yet</li>}
            </ul>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Draw / sold history</p>
        <ul className="mt-3 space-y-2 text-sm text-white/80">
          {runtime?.history?.length
            ? runtime.history.slice(0, 8).map((h) => <li key={h.id}>• {h.playerName ?? "Player"} · {h.state}</li>)
            : <li>No history yet</li>}
        </ul>
      </div>
    </section>
  );
}
