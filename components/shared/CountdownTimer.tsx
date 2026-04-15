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
      ? "Website Launch Countdown"
      : phase === "tournament_start"
        ? "Tournament Start Countdown"
        : "Live / Started";

  return (
    <div className="card p-5 shadow-glow">
      <p className="text-sm uppercase tracking-widest text-neon">{title}</p>
      {phase === "live" ? (
        <p className="mt-3 text-3xl font-extrabold">🔥 GFL is LIVE</p>
      ) : (
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            { label: "D", value: parts.d },
            { label: "H", value: parts.h },
            { label: "M", value: parts.m },
            { label: "S", value: parts.s }
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-white/5 p-3">
              <p className="text-2xl font-bold">{String(item.value).padStart(2, "0")}</p>
              <p className="text-xs text-white/70">{item.label}</p>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-white/60">Timezone: Asia/Kolkata (IST)</p>
    </div>
  );
}
