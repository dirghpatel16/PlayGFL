const schedule = [
  { match: "Opening Clash", date: "Apr 18, 2026 • 9:00 PM IST", map: "Erangel" },
  { match: "Mid Table War", date: "Apr 19, 2026 • 8:00 PM IST", map: "Miramar" },
  { match: "Grand Final", date: "Apr 26, 2026 • 9:00 PM IST", map: "Sanhok + Erangel" }
];

export function ScheduleCards() {
  return (
    <div className="grid gap-3">
      {schedule.map((m) => (
        <article key={m.match} className="card p-4">
          <p className="text-xs uppercase tracking-wide text-neon">{m.map}</p>
          <h3 className="mt-1 font-bold">{m.match}</h3>
          <p className="text-sm text-white/70">{m.date}</p>
        </article>
      ))}
    </div>
  );
}
