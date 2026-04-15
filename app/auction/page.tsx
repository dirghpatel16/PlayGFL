import { AuctionStagePanel } from "@/components/auction/AuctionStagePanel";
import { AIHostPanel } from "@/components/shared/AIHostPanel";

export default function AuctionPage() {
  return (
    <div className="py-8 space-y-6">
      <h1 className="section-title">GFL Auction Arena</h1>
      <AuctionStagePanel />
      <AIHostPanel dynamicLine="Captain Raven locks in ClutchBhai. Big pickup." />
    </div>
  );
}
