"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeroSection } from "@/components/home/HeroSection";
import { HighlightsStrip } from "@/components/home/HighlightsStrip";
import { AnnouncementTicker } from "@/components/shared/AnnouncementTicker";
import { fetchJSON } from "@/lib/services/http";
import { Tournament, Captain, Announcement } from "@/lib/types/models";
import { scoringConfig, seasonConfig } from "@/lib/config/season";

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

      <section className="mt-7 grid gap-3 sm:mt-10 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/auth/signup" className="card p-4 hover:border-neon">Register</Link>
        <Link href="/payment" className="card p-4 hover:border-neon">Pay Entry Fee ₹{seasonConfig.entryFee}</Link>
        <Link href="/tournament" className="card p-4 hover:border-neon">View Tournament</Link>
        <Link href="/auction" className="card p-4 hover:border-neon">View Auction</Link>
      </section>

      <section className="mt-8 grid gap-4 sm:mt-12 sm:gap-6 lg:grid-cols-2">
        <article className="card p-5">
          <p className="eyebrow">Match Format Overview</p>
          <h2 className="section-title mt-2">Season 2 Rules Snapshot</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>• Normal rounds: {scoringConfig.normalRounds.gamesPerRound} games each.</li>
            <li>• Placement: 1st {scoringConfig.normalRounds.placement.first}, 2nd {scoringConfig.normalRounds.placement.second}, 3rd {scoringConfig.normalRounds.placement.third}.</li>
            <li>• Bonus: back-to-back +{scoringConfig.bonuses.backToBackChicken}, threepeat +{scoringConfig.bonuses.threepeatChicken}.</li>
            <li>• Golden rounds on {scoringConfig.goldenRounds.map} with nominated player x{scoringConfig.goldenRounds.nominatedMultiplier}.</li>
          </ul>
        </article>

        <article className="event-panel">
          <p className="eyebrow">Community</p>
          <h3 className="mt-2 text-2xl font-black uppercase">Join GFL Community</h3>
          <p className="mt-3 text-sm text-white/75">Follow updates, scrim calls, and live season alerts.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="https://discord.gg/XzgMJMK3" target="_blank" rel="noopener noreferrer" className="cta-primary focus:outline-none focus:ring-2 focus:ring-neon">Discord</a>
            <a href="https://www.instagram.com/playgfl?igsh=dGppa2tkenVoaDV3" target="_blank" rel="noopener noreferrer" className="cta-ghost focus:outline-none focus:ring-2 focus:ring-neon">Instagram</a>
          </div>
        </article>
      </section>
    </>
  );
}
