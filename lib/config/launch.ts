export const LAUNCH_UNLOCK_AT_IST = "2026-04-15T19:00:00+05:30";
export const LAUNCH_UNLOCK_AT_LABEL = "7:00 PM IST";

export function getLaunchDate() {
  return new Date(LAUNCH_UNLOCK_AT_IST);
}

export function isLaunchUnlocked(now: Date = new Date()) {
  return now.getTime() >= getLaunchDate().getTime();
}

export function getLaunchCountdown(now: Date = new Date()) {
  const diff = Math.max(0, getLaunchDate().getTime() - now.getTime());

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);

  return { d, h, m, s, diff };
}
