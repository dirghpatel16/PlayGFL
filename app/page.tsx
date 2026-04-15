"use client";

import { useEffect, useState } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { HighlightsStrip } from "@/components/home/HighlightsStrip";
import { AnnouncementTicker } from "@/components/shared/AnnouncementTicker";
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
      <HeroSection tournament={data?.tournament} />
      <AnnouncementTicker announcements={data?.announcements ?? []} />
      <HighlightsStrip />

      <section className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <article>
          <p className="eyebrow">League Structure</p>
          <h2 className="section-title mt-3">Competitive path from registration to finals.</h2>
          <ol className="mt-6 space-y-5 border-l border-white/20 pl-5">
            {[
              "Registration + identity verification",
              "Profile screening and roster approval",
              "Captain auction draft and season lock-in"
            ].map((step, i) => (
              <li key={step} className="relative">
                <span className="absolute -left-[30px] top-0 text-xs font-bold tracking-[0.2em] text-neon">0{i + 1}</span>
                <p className="text-base font-semibold uppercase tracking-wide">{step}</p>
              </li>
            ))}
          </ol>
        </article>

        <article className="event-panel">
          <p className="eyebrow">Commissioner Note</p>
          <p className="mt-4 text-lg font-semibold uppercase leading-relaxed text-white/90">
            This is a tournament-first environment. No gimmicks. No filler. Just disciplined operations and high-pressure BGMI competition.
          </p>
        </article>
      </section>

      <section className="mt-12">
        <p className="eyebrow">Captain Lineup</p>
        <h2 className="section-title mt-3">Draft leaders for season one.</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {data?.captains?.length ? (
            data.captains.map((c) => (
              <article key={c.id} className="border border-white/15 bg-white/[0.02] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-neon">{c.tag}</p>
                <h3 className="mt-3 text-2xl font-black uppercase">{c.name}</h3>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-white/65">Region · {c.region}</p>
              </article>
            ))
          ) : (
            <p className="text-sm text-white/70">No captains added yet. Admin can add captains from the Admin panel.</p>
          )}
        </div>
      </section>
    </>
  );
}
