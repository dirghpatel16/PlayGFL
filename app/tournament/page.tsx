"use client";

import { useEffect, useState } from "react";
import { ScheduleCards } from "@/components/tournament/ScheduleCards";
import { fetchJSON } from "@/lib/services/http";
import { Captain, Tournament } from "@/lib/types/models";

interface PublicPayload {
  tournament: Tournament;
  captains: Captain[];
}

function normalizeTournamentName(name?: string) {
  if (!name) return "PlayGFL Season 2";
  return name.replace(/GFL Season 1/gi, "PlayGFL Season 2").replace(/GFL/gi, "PlayGFL");
}

export default function TournamentPage() {
  const [data, setData] = useState<PublicPayload | null>(null);

  useEffect(() => {
    fetchJSON<PublicPayload>("/api/public").then(setData).catch(() => null);
  }, []);

  return (
    <div className="py-8 space-y-6">
      <section className="card p-5">
        <h1 className="section-title">{normalizeTournamentName(data?.tournament?.name)}</h1>
        <p className="mt-2 text-sm text-white/75">Game: BGMI • Timezone: Asia/Kolkata</p>
        <p className="mt-3 text-sm text-white/75">Registration: {data?.tournament?.registrationOpen ? "Open" : "Closed"}</p>
      </section>

      <section>
        <h2 className="section-title">Team Captains</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {data?.captains?.length ? (
            data.captains.map((c) => (
              <div key={c.id} className="card p-4">
                <h3 className="font-bold">{c.name}</h3>
                <p className="text-sm text-white/70">{c.region}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-white/70">Captains for PlayGFL Season 2 will be announced soon.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="section-title">Schedule</h2>
        <div className="mt-3"><ScheduleCards /></div>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-bold">FAQ</h2>
        <ul className="mt-3 space-y-2 text-sm text-white/80">
          <li>• Format: Captain-led draft with admin-supervised tournament operations.</li>
          <li>• Approved player pools and auction eligibility update after trials.</li>
          <li>• Rulebook and anti-cheat checks are enforced for all matches.</li>
        </ul>
      </section>
    </div>
  );
}
