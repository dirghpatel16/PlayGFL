import { tournament, captains } from "@/lib/data/mock";
import { ScheduleCards } from "@/components/tournament/ScheduleCards";

export default function TournamentPage() {
  return (
    <div className="py-8 space-y-6">
      <section className="card p-5">
        <h1 className="section-title">{tournament.name}</h1>
        <p className="mt-2 text-sm text-white/75">Game: {tournament.game} • Timezone: {tournament.timezone}</p>
        <p className="mt-3 text-sm text-white/75">Registration: {tournament.registrationOpen ? "Open" : "Closed"}</p>
      </section>
      <section>
        <h2 className="section-title">Team Captains</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {captains.map((c) => <div key={c.id} className="card p-4"><h3 className="font-bold">{c.name}</h3><p className="text-sm text-white/70">{c.region}</p></div>)}
        </div>
      </section>
      <section>
        <h2 className="section-title">Schedule</h2>
        <div className="mt-3"><ScheduleCards /></div>
      </section>
      <section className="card p-5">
        <h2 className="text-xl font-bold">FAQ</h2>
        <ul className="mt-3 space-y-2 text-sm text-white/80">
          <li>• Format: Draft-based with captain picks.</li>
          <li>• Points table and MVP board will update post-match.</li>
          <li>• Rulebook and anti-cheat checks enforced by admins.</li>
        </ul>
      </section>
    </div>
  );
}
