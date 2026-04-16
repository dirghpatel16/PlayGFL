import Link from "next/link";
import { Tournament } from "@/lib/types/models";
import { CountdownTimer } from "@/components/shared/CountdownTimer";

interface HeroSectionProps {
  tournament?: Tournament;
}

export function HeroSection({ tournament }: HeroSectionProps) {
  return (
    <section className="pt-5 sm:pt-10">
      <div className="hero-shell grid gap-6 p-4 sm:p-7 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:p-10">
        <div className="flex flex-col justify-between gap-5 sm:gap-7">
          <div>
            <p className="eyebrow">GFL • Season 2</p>
            <h1 className="hero-title mt-3">GFL SEASON 2 EVENT HUB</h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
              A premium, mobile-first BGMI league hub for Season 2 with registration, payment, auction, standings, and public match coverage.
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

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link className="cta-primary" href="/auth/signup">
              Register
            </Link>
            <Link className="cta-ghost" href="/tournament">
              View Tournament
            </Link>
          </div>
        </div>

        <aside className="event-panel">
          <p className="eyebrow">Official Event Portal</p>
          <h2 className="mt-3 text-xl font-black uppercase leading-tight sm:mt-4 sm:text-3xl">GFL Season 2</h2>
          <div className="mt-6 space-y-4 border-t border-white/15 pt-5 text-sm">
            <div className="meta-row">
              <span>Season</span>
              <strong>Season 2 · 2026</strong>
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
              <strong>₹{(tournament?.prizePoolINR ?? 150).toLocaleString("en-IN")}</strong>
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
