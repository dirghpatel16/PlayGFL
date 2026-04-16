"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CountdownLanding } from "@/components/launch/CountdownLanding";
import { LAUNCH_UNLOCK_AT_IST } from "@/lib/config/launch";

interface Props {
  children: ReactNode;
  initialUnlocked: boolean;
}

function isUnlockedNow() {
  return Date.now() >= new Date(LAUNCH_UNLOCK_AT_IST).getTime();
}

export function LaunchGate({ children, initialUnlocked }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(initialUnlocked);

  useEffect(() => {
    if (unlocked) return;

    const tick = () => {
      if (isUnlockedNow()) setUnlocked(true);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [unlocked]);

  useEffect(() => {
    if (!unlocked || pathname !== "/launch") return;
    router.replace("/");
  }, [pathname, router, unlocked]);

  const shouldGate = useMemo(() => !unlocked, [unlocked]);

  if (shouldGate) {
    return <CountdownLanding />;
  }

  return <>{children}</>;
}
