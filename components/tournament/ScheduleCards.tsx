import { seasonMatchPlan } from "@/lib/config/matchFormat";

export function ScheduleCards() {
  return (
    <div className="grid gap-3">
      {[1, 2, 3, 4, 5, 6].map((block) => {
        const matches = seasonMatchPlan.filter((m) => m.block === block);
        return (
          <article key={block} className="card p-4">
            <h3 className="font-bold">Block {block}: Matches {matches[0]?.matchNumber}–{matches[matches.length - 1]?.matchNumber}</h3>
            <p className="mt-1 text-xs text-white/70">Cycle {matches[0]?.cycle} • {matches.filter((m) => m.roundType === "normal").length} Normal + 1 Golden</p>
            <ul className="mt-2 grid gap-1 sm:grid-cols-2 text-xs">
              {matches.map((m) => (
                <li key={m.matchNumber} className="rounded border border-white/10 p-2">
                  <span className="font-semibold">M{m.matchNumber}</span> • {m.map} •
                  <span className={m.roundType === "golden" ? "text-neon font-semibold" : "text-white/75"}> {m.roundType === "golden" ? "Golden" : "Normal"}</span>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
