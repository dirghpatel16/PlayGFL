import { seasonConfig } from "@/lib/config/season";

const highlights = [
  { label: "Captains", value: `${seasonConfig.captains}` },
  { label: "Auction Players", value: `${seasonConfig.auctionPlayers}` },
  { label: "Matches", value: `${seasonConfig.matches}` },
  { label: "Prize Pool", value: `₹${seasonConfig.prizePool}` }
];

export function HighlightsStrip() {
  return (
    <section className="mt-8 border-y border-white/15 py-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map((item) => (
          <div key={item.label} className="flex items-end justify-between border-l border-white/20 pl-4 first:border-l-0 first:pl-0">
            <div>
              <p className="text-2xl font-black tracking-wide text-neon sm:text-3xl">{item.value}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/55">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
