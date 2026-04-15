"use client";

import { useEffect, useState } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { HighlightsStrip } from "@/components/home/HighlightsStrip";
import { CountdownTimer } from "@/components/shared/CountdownTimer";
import { AnnouncementTicker } from "@/components/shared/AnnouncementTicker";
import { AIHostPanel } from "@/components/shared/AIHostPanel";
import { fetchJSON } from "@/lib/services/http";
import { Tournament, Captain, Announcement } from "@/lib/types/models";

interface PublicPayload {
  tournament: Tournament;
  captains: Captain[];
  announcements: Announcement[];
}

export default function HomePage() {
  const [data, setData] = useState<PublicPayload | null>(null);

  useEffect(() => {
    fetchJSON<PublicPayload>("/api/public").then(setData).catch(() => null);
  }, []);

  return (
    <>
      <HeroSection />
      <AnnouncementTicker announcements={data?.announcements ?? []} />
      {data?.tournament && (
        <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <CountdownTimer launchISO={data.tournament.launchAtIST} startISO={data.tournament.startsAtIST} />
          <article className="card p-5">
            <p className="text-xs uppercase tracking-widest text-neon">Upcoming tournament</p>
            <h3 className="mt-2 text-2xl font-bold">{data.tournament.name}</h3>
            <p className="mt-2 text-sm text-white/75">Format: {data.tournament.format}</p>
            <p className="text-sm text-white/75">Prize pool: ₹{data.tournament.prizePoolINR.toLocaleString("en-IN")}</p>
          </article>
        </section>
      )}
      <HighlightsStrip />

      <section className="mt-10">
        <h2 className="section-title">How it works</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {["Register + verify email", "Complete profile & get approved", "Enter captain auction draft"].map((s, i) => (
            <div key={s} className="card p-4">
              <p className="text-neon">0{i + 1}</p>
              <p className="mt-1 font-semibold">{s}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="section-title">Captains</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {data?.captains?.length ? (
            data.captains.map((c) => (
              <article key={c.id} className="card p-4">
                <p className="text-xs text-neon">{c.tag}</p>
                <h3 className="mt-1 text-xl font-bold">Captain {c.name}</h3>
                <p className="text-sm text-white/70">Region: {c.region}</p>
              </article>
            ))
          ) : (
            <p className="text-sm text-white/70">No captains added yet. Admin can add captains from the Admin panel.</p>
          )}
        </div>
      </section>

      <AIHostPanel dynamicLine="Welcome to GFL. The battleground is almost ready." />
    </>
  );
}
