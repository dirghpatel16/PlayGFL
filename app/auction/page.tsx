import { AuctionStagePanel } from "@/components/auction/AuctionStagePanel";

export default function AuctionPage() {
  return (
    <div className="py-8 space-y-6">
      <h1 className="section-title">PlayGFL Season 2 Auction</h1>
      <section className="card p-4 text-sm text-white/75">
        <p className="font-semibold">How Auction Works</p>
        <p className="mt-2">Public viewers can track lot draw, current player spotlight, remaining pot, and squad rosters live.</p>
      </section>
      <AuctionStagePanel />
    </div>
  );
}
