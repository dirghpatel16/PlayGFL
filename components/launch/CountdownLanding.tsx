"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getLaunchCountdown, LAUNCH_UNLOCK_AT_LABEL } from "@/lib/config/launch";

export function CountdownLanding() {
  const router = useRouter();
  const [now, setNow] = useState(new Date());
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const countdown = useMemo(() => getLaunchCountdown(now), [now]);

  useEffect(() => {
    if (countdown.diff > 0 || unlocking) return;

    setUnlocking(true);
    const t = setTimeout(() => router.replace("/"), 1300);
    return () => clearTimeout(t);
  }, [countdown.diff, unlocking, router]);

  return (
    <section className="launch-lockscreen min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-12">
        <p className="eyebrow">Global Fight League • Official Launch Gate</p>
        <h1 className="mt-4 text-4xl font-black uppercase leading-[0.95] sm:text-6xl lg:text-7xl">India&apos;s Battleground Unlocks In</h1>
        <p className="mt-5 max-w-2xl text-sm uppercase tracking-[0.12em] text-white/70 sm:text-base">Website unlocks at {LAUNCH_UNLOCK_AT_LABEL} · Asia/Kolkata</p>

        <div className="launch-timer mt-8 grid grid-cols-4 gap-3 sm:mt-10 sm:gap-5">
          {[
            { label: "Days", value: countdown.d },
            { label: "Hours", value: countdown.h },
            { label: "Mins", value: countdown.m },
            { label: "Secs", value: countdown.s }
          ].map((unit) => (
            <div key={unit.label} className="border border-white/20 bg-black/45 p-3 text-center sm:p-5">
              <p className="text-4xl font-black tracking-tight sm:text-7xl">{String(unit.value).padStart(2, "0")}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-white/55 sm:text-xs">{unit.label}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-neon sm:text-sm">{unlocking ? "Unlocking arena..." : "Registration opens soon"}</p>

        <div className="mt-4 h-1 w-full overflow-hidden border border-white/20 bg-black/50">
          <div className={`h-full bg-neon transition-all duration-700 ${unlocking ? "w-full" : "w-1/3 animate-pulse"}`} />
        </div>
      </div>
    </section>
  );
}
