import Link from "next/link";
import { Tournament } from "@/lib/types/models";
import { CountdownTimer } from "@/components/shared/CountdownTimer";

interface HeroSectionProps {
  tournament?: Tournament;
}

export function HeroSection({ tournament }: HeroSectionProps) {
  return (
    <section className="pt-8 sm:pt-12">
      <div className="hero-shell grid gap-8 p-5 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:p-10">
        <div className="flex flex-col justify-between gap-7">
          <div>
            <p className="eyebrow">Global Fight League • Bgmi Season 01</p>
            <h1 className="hero-title mt-4">BATTLEGROUNDS. BUILT FOR CHAMPIONS.</h1>
            <p className="mt-5 max-w-xl text-sm text-white/75 sm:text-base">
              India&apos;s most serious BGMI competition platform. Verified talent, captain-led drafts, and league operations built for elite play.
            </p>
          </div>

          {tournament ? (
            <CountdownTimer launchISO={tournament.launchAtIST} startISO={tournament.startsAtIST} />
          ) : (
            <div className="countdown-shell">
              <p className="eyebrow text-white/60">Event Countdown</p>
              <p className="mt-3 text-3xl font-black tracking-wide sm:text-5xl">-- : -- : -- : --</p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/40">Loading league clock</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Link className="cta-primary" href="/auth/signup">
              Register For Trials
            </Link>
            <Link className="cta-ghost" href="/tournament">
              View Rulebook
            </Link>
          </div>
        </div>

        <aside className="event-panel">
          <p className="eyebrow">Official Event Portal</p>
          <h2 className="mt-4 text-2xl font-black uppercase leading-tight sm:text-3xl">GFL Championship Circuit</h2>
          <div className="mt-6 space-y-4 border-t border-white/15 pt-5 text-sm">
            <div className="meta-row">
              <span>Season</span>
              <strong>01 · 2026</strong>
            </div>
            <div className="meta-row">
              <span>Game</span>
              <strong>BGMI</strong>
            </div>
            <div className="meta-row">
              <span>Format</span>
              <strong>{tournament?.format ?? "Captain Draft + League Stage"}</strong>
            </div>
            <div className="meta-row">
              <span>Prize Pool</span>
              <strong>₹{(tournament?.prizePoolINR ?? 50000).toLocaleString("en-IN")}</strong>
            </div>
          </div>
          <div className="mt-6 border-t border-white/10 pt-4 text-xs uppercase tracking-[0.22em] text-white/55">
            Broadcast Ready · Competitive Integrity · Tournament Ops
          </div>
        </aside>
      </div>
    </section>
  );
}
