"use client";

import { useEffect, useMemo, useState } from "react";
import { getCountdownPhase, getTimeDiffParts } from "@/lib/services/countdown";

interface Props {
  launchISO: string;
  startISO: string;
}

export function CountdownTimer({ launchISO, startISO }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const phase = getCountdownPhase(now, launchISO, startISO);
  const target = phase === "website_launch" ? launchISO : startISO;
  const parts = useMemo(() => getTimeDiffParts(target, now), [target, now]);

  const title =
    phase === "website_launch"
      ? "Site Unlock"
      : phase === "tournament_start"
        ? "League Kickoff"
        : "Live";

  return (
    <div className="countdown-shell">
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow text-white/70">{title} Countdown</p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">IST</p>
      </div>

      {phase === "live" ? (
        <p className="mt-3 text-2xl font-black uppercase tracking-wider text-neon sm:text-4xl">GFL LIVE NOW</p>
      ) : (
        <div className="countdown-grid mt-4">
          {[
            { label: "Days", value: parts.d },
            { label: "Hours", value: parts.h },
            { label: "Mins", value: parts.m },
            { label: "Secs", value: parts.s }
          ].map((item) => (
            <div key={item.label}>
              <p className="countdown-digit">{String(item.value).padStart(2, "0")}</p>
              <p className="countdown-label">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/40">Target timezone: Asia/Kolkata</p>
    </div>
  );
}
