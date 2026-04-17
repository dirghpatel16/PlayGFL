import { AuctionStagePanel } from "@/components/auction/AuctionStagePanel";
import { CommissionerPanel } from "@/components/commissioner/CommissionerPanel";

export default function AuctionPage() {
  return (
    <div className="py-8 space-y-6">
      <h1 className="section-title">GFL Season 2 Auction</h1>
      <section className="card p-4 text-sm text-white/75">
        <p className="font-semibold">How Auction Works</p>
        <p className="mt-2">Public viewers can track lot draw, active player spotlight, remaining pot, and squad rosters live. Commissioner mode unlocks operational controls.</p>
      </section>
      <AuctionStagePanel />
      <CommissionerPanel />
    </div>
  );
}
