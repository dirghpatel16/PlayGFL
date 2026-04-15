import { AuctionPlayer } from "@/lib/types/models";

export function PlayerCard({ player, soldTo }: { player: AuctionPlayer; soldTo?: string }) {
  return (
    <article className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-lg font-bold">{player.name}</h4>
          <p className="text-xs text-white/70">{player.region} • {player.role}</p>
        </div>
        {soldTo && <span className="rounded-full bg-accent/30 px-3 py-1 text-xs">Sold to {soldTo}</span>}
      </div>
      <p className="mt-3 text-sm text-white/80">{player.style}</p>
    </article>
  );
}
