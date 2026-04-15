"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJSON } from "@/lib/services/http";
import { Captain, Team } from "@/lib/types/models";

interface AuctionRuntime {
  state: "waiting" | "player_reveal" | "selection" | "sold" | "complete";
  currentPlayer?: { id: string; name: string };
  currentCaptainTurnIndex: number;
  teams: Team[];
}

export function AuctionStagePanel() {
  const [runtime, setRuntime] = useState<AuctionRuntime | null>(null);
  const [captains, setCaptains] = useState<Captain[]>([]);
  const [playerMap, setPlayerMap] = useState<Record<string, string>>({});

  const load = () => {
    fetchJSON<AuctionRuntime>("/api/auction/state").then(setRuntime);
    fetchJSON<{ captains: Captain[] }>("/api/captains").then((d) => setCaptains(d.captains));
    fetchJSON<{ players: { id: string; name: string }[] }>("/api/players").then((d) =>
      setPlayerMap(Object.fromEntries(d.players.map((p) => [p.id, p.name])))
    );
  };

  useEffect(() => {
    load();
  }, []);

  const turnCaptain = runtime ? captains[runtime.currentCaptainTurnIndex] : undefined;

  const statusText = useMemo(() => {
    if (!runtime) return "Loading";
    switch (runtime.state) {
      case "waiting": return "Waiting to start";
      case "player_reveal": return "Player Reveal";
      case "selection": return `Selection: ${turnCaptain?.name ?? "Unknown"}`;
      case "sold": return "Player Sold";
      default: return "Auction Complete";
    }
  }, [runtime, turnCaptain?.name]);

  const act = async (action: string, captainId?: string) => {
    await fetchJSON("/api/auction/state", {
      method: "POST",
      body: JSON.stringify({ action, captainId })
    });
    load();
  };

  return (
    <section className="space-y-4">
      <div className="card p-5">
        <p className="text-xs uppercase tracking-widest text-neon">Auction Stage</p>
        <h2 className="mt-2 text-2xl font-bold">{statusText}</h2>
        {runtime?.currentPlayer && (
          <p className="mt-2 text-white/80">Current player: <span className="font-semibold">{runtime.currentPlayer.name}</span></p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-lg bg-accent px-3 py-2 text-sm" onClick={() => act("start_reveal")}>Start Reveal</button>
          <button className="rounded-lg bg-white/10 px-3 py-2 text-sm" onClick={() => act("open_selection")}>Open Selection</button>
          {captains.map((c) => (
            <button
              key={c.id}
              className="rounded-lg bg-white/10 px-3 py-2 text-sm"
              onClick={() => act("pick", c.id)}
              disabled={runtime?.state !== "selection"}
            >
              Pick: {c.name}
            </button>
          ))}
          <button className="rounded-lg bg-white/10 px-3 py-2 text-sm" onClick={() => act("next")}>Next Player</button>
          <button className="rounded-lg bg-danger/20 px-3 py-2 text-sm" onClick={() => act("reset")}>Reset</button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {runtime?.teams?.map((team) => (
          <div className="card p-4" key={team.id}>
            <h3 className="font-semibold">{team.name}</h3>
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
