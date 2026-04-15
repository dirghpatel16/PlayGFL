"use client";

import { useEffect, useState } from "react";
import { PlayerCard } from "@/components/profile/PlayerCard";
import { fetchJSON } from "@/lib/services/http";
import { AuctionPlayer, Captain } from "@/lib/types/models";

export default function PlayersPage() {
  const [players, setPlayers] = useState<AuctionPlayer[]>([]);
  const [captains, setCaptains] = useState<Captain[]>([]);

  useEffect(() => {
    fetchJSON<{ players: AuctionPlayer[] }>("/api/players").then((d) => setPlayers(d.players));
    fetchJSON<{ captains: Captain[] }>("/api/captains").then((d) => setCaptains(d.captains));
  }, []);

  return (
    <section className="py-8">
      <h1 className="section-title">Auction Player Pool</h1>
      {!players.length && <p className="mt-3 text-sm text-white/70">No players registered in the auction pool yet.</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((p) => (
          <PlayerCard
            key={p.id}
            player={p}
            soldTo={p.soldToCaptainId ? captains.find((c) => c.id === p.soldToCaptainId)?.name : undefined}
          />
        ))}
      </div>
    </section>
  );
}
