"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlayerCard } from "@/components/profile/PlayerCard";
import { fetchJSON } from "@/lib/services/http";
import { AuctionPlayer, Captain } from "@/lib/types/models";

export default function PlayersPage() {
  const [players, setPlayers] = useState<AuctionPlayer[]>([]);
  const [captains, setCaptains] = useState<Captain[]>([]);

  useEffect(() => {
    fetchJSON<{ players: AuctionPlayer[] }>("/api/players").then((d) => setPlayers(d.players)).catch(() => null);
    fetchJSON<{ captains: Captain[] }>("/api/captains").then((d) => setCaptains(d.captains)).catch(() => null);
  }, []);

  return (
    <section className="py-8 space-y-6">
      <div>
        <h1 className="section-title">GFL Auction Player Pool</h1>
        {!players.length && (
          <p className="mt-3 text-sm text-white/70">The auction pool is being prepared. Approved players will appear here after trials and shortlisting.</p>
        )}
      </div>

      {!!captains.length && (
        <section>
          <p className="eyebrow">Season 2 Captains</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {captains.map((c) => (
              <article key={c.id} className="card p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-neon">{c.tag}</p>
                <h3 className="mt-2 text-xl font-black uppercase">{c.name}</h3>
                <p className="text-sm text-white/70">{c.region}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((p) => (
          <PlayerCard
            key={p.id}
            player={p}
            soldTo={p.soldToCaptainId ? captains.find((c) => c.id === p.soldToCaptainId)?.name : undefined}
          />
        ))}
      </div>

      {!players.length && (
        <div className="card p-4 text-sm text-white/70">
          Admin note: use the <Link href="/admin" className="text-neon underline">commissioner console</Link> to manage the live player list, captains, and auction pool.
        </div>
      )}
    </section>
  );
}
