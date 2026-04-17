"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ScheduleCards } from "@/components/tournament/ScheduleCards";
import { fetchJSON } from "@/lib/services/http";
import { Captain, Tournament } from "@/lib/types/models";
import { scoringConfig, seasonConfig } from "@/lib/config/season";

interface PublicPayload {
  tournament: Tournament;
  captains: Captain[];
}

export default function TournamentPage() {
  const [data, setData] = useState<PublicPayload | null>(null);

  useEffect(() => {
    fetchJSON<PublicPayload>("/api/public").then(setData).catch(() => null);
  }, []);

  return (
    <div className="py-8 space-y-6">
      <section className="card p-5">
        <h1 className="section-title">GFL Season 2 Tournament</h1>
        <p className="mt-2 text-sm text-white/75">Entry Fee ₹{seasonConfig.entryFee} • Prize Pool ₹{seasonConfig.prizePool} • Timing {seasonConfig.timing}</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card p-5">
          <h2 className="text-xl font-bold">Match Format & Points</h2>
          <ul className="mt-3 space-y-1 text-sm text-white/80">
            <li>• Season structure: 30 matches across 6 blocks (4/5/6 repeated twice)</li>
            <li>• 1st: {scoringConfig.normalRounds.placement.first} • 2nd: {scoringConfig.normalRounds.placement.second} • 3rd: {scoringConfig.normalRounds.placement.third}</li>
            <li>• Back-to-back chicken dinners: +{scoringConfig.bonuses.backToBackChicken}</li>
            <li>• Three back-to-back chicken dinners: +{scoringConfig.bonuses.threepeatChicken}</li>
          </ul>
          <h3 className="mt-4 font-semibold">Golden Rounds</h3>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li>• Map: {scoringConfig.goldenRounds.map}</li>
            <li>• 1st: {scoringConfig.goldenRounds.placement.first} • 2nd: {scoringConfig.goldenRounds.placement.second} • 3rd: {scoringConfig.goldenRounds.placement.third}</li>
            <li>• Each kill: +{scoringConfig.goldenRounds.killPoint}</li>
            <li>• Nominated players score x{scoringConfig.goldenRounds.nominatedMultiplier}</li>
          </ul>
        </article>

        <article className="card p-5">
          <h2 className="text-xl font-bold">Prize Breakdown</h2>
          <ul className="mt-3 space-y-1 text-sm text-white/80">
            <li>• 1st place: ₹{seasonConfig.prizes.first}</li>
            <li>• 2nd place: ₹{seasonConfig.prizes.second}</li>
            <li>• 3rd place: ₹{seasonConfig.prizes.third}</li>
          </ul>
          <h3 className="mt-4 font-semibold">Teams & Captains</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {data?.captains?.length ? data.captains.map((c) => <div key={c.id} className="rounded border border-white/10 p-2 text-sm">{c.name} ({c.tag})</div>) : <p className="text-sm text-white/70">Captains announced soon.</p>}
          </div>
          <div className="mt-4 flex gap-3">
            <Link href="/standings" className="cta-ghost">Standings</Link>
            <Link href="/auction" className="cta-ghost">Auction</Link>
          </div>
        </article>
      </section>

      <section>
        <h2 className="section-title">30-Match Season Schedule</h2>
        <div className="mt-3"><ScheduleCards /></div>
      </section>
    </div>
  );
}
