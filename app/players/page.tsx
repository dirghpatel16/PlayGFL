import { PlayerCard } from "@/components/profile/PlayerCard";
import { auctionPlayers, captains } from "@/lib/data/mock";

export default function PlayersPage() {
  return (
    <section className="py-8">
      <h1 className="section-title">Auction Player Pool</h1>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {auctionPlayers.map((p, i) => <PlayerCard key={p.id} player={p} soldTo={i < 2 ? captains[i].name : undefined} />)}
      </div>
    </section>
  );
}
