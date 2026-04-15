const highlights = [
  { label: "Total Slots", value: "12" },
  { label: "Captains", value: "3" },
  { label: "Auction Pool", value: "9" },
  { label: "Prize Pool", value: "₹50,000" }
];

export function HighlightsStrip() {
  return (
    <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {highlights.map((item) => (
        <div className="card p-4 text-center" key={item.label}>
          <p className="text-xl font-extrabold text-neon">{item.value}</p>
          <p className="mt-1 text-xs text-white/70">{item.label}</p>
        </div>
      ))}
    </section>
  );
}
