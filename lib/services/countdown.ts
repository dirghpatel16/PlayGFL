export type CountdownPhase = "website_launch" | "tournament_start" | "live";

export function getCountdownPhase(now: Date, launchISO: string, startISO: string): CountdownPhase {
  const launch = new Date(launchISO);
  const start = new Date(startISO);
  if (now < launch) return "website_launch";
  if (now >= launch && now < start) return "tournament_start";
  return "live";
}

export function getTimeDiffParts(targetISO: string, now: Date) {
  const target = new Date(targetISO).getTime();
  const diff = Math.max(0, target - now.getTime());
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return { d, h, m, s };
}
