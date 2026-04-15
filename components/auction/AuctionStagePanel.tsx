"use client";

import { useMemo, useState } from "react";
import { auctionPlayers, captains, teams } from "@/lib/data/mock";
import { beginSelection, initializeAuction, lockPick, proceedToNext, startReveal } from "@/lib/services/auction";

export function AuctionStagePanel() {
  const [runtime, setRuntime] = useState(() => initializeAuction(auctionPlayers, teams));
  const turnCaptain = captains[runtime.currentCaptainTurnIndex];

  const statusText = useMemo(() => {
    switch (runtime.state) {
      case "waiting": return "Waiting to start";
      case "player_reveal": return "Player Reveal";
      case "selection": return `Selection: ${turnCaptain.name}`;
      case "sold": return "Player Sold";
      default: return "Auction Complete";
    }
  }, [runtime.state, turnCaptain.name]);

  return (
    <section className="space-y-4">
      <div className="card p-5">
        <p className="text-xs uppercase tracking-widest text-neon">Auction Stage</p>
        <h2 className="mt-2 text-2xl font-bold">{statusText}</h2>
        {runtime.currentPlayer && (
          <p className="mt-2 text-white/80">Current player: <span className="font-semibold">{runtime.currentPlayer.name}</span></p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-lg bg-accent px-3 py-2 text-sm" onClick={() => setRuntime((s) => startReveal(s))}>Start Reveal</button>
          <button className="rounded-lg bg-white/10 px-3 py-2 text-sm" onClick={() => setRuntime((s) => beginSelection(s))}>Open Selection</button>
          {captains.map((c) => (
            <button
              key={c.id}
              className="rounded-lg bg-white/10 px-3 py-2 text-sm"
              onClick={() => setRuntime((s) => lockPick(s, captains, c.id))}
              disabled={runtime.state !== "selection"}
            >
              Pick: {c.name}
            </button>
          ))}
          <button className="rounded-lg bg-white/10 px-3 py-2 text-sm" onClick={() => setRuntime((s) => proceedToNext(s))}>Next Player</button>
          <button className="rounded-lg bg-danger/20 px-3 py-2 text-sm" onClick={() => setRuntime(initializeAuction(auctionPlayers, teams))}>Reset</button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {runtime.teams.map((team) => (
          <div className="card p-4" key={team.id}>
            <h3 className="font-semibold">{captains.find((c) => c.id === team.captainId)?.name} Squad</h3>
            <ul className="mt-2 space-y-1 text-sm text-white/80">
              {team.playerIds.length ? team.playerIds.map((id) => <li key={id}>• {auctionPlayers.find((p) => p.id === id)?.name}</li>) : <li>No picks yet</li>}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
