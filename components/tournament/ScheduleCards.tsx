import { matchPlan } from "@/lib/config/season";

export function ScheduleCards() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {matchPlan.map((m) => (
        <article key={m.matchNumber} className={`card p-4 ${m.roundType === "golden" ? "border-amber-400/50" : ""}`}>
          <p className="text-xs uppercase tracking-wide text-neon">Block {m.block} • Match {m.matchNumber}</p>
          <h3 className="mt-1 font-bold">{m.roundType === "golden" ? "Golden Round" : "Normal Round"}</h3>
          <p className="text-sm text-white/70">9:00 PM - 12:00 AM IST</p>
        </article>
      ))}
    </div>
  );
}
