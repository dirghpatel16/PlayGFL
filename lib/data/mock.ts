import { Announcement, AuctionPlayer, Captain, Team, Tournament } from "@/lib/types/models";

export const tournament: Tournament = {
  id: "gfl-s1",
  name: "GFL Season 1",
  game: "BGMI",
  timezone: "Asia/Kolkata",
  launchAtIST: "2026-04-15T18:00:00+05:30",
  startsAtIST: "2026-04-18T21:00:00+05:30",
  registrationOpen: true,
  prizePoolINR: 50000,
  format: "3 captains draft 9 auction players; BO3 finals"
};

export const captains: Captain[] = [
  { id: "cap-1", name: "Raven", tag: "RVN", region: "Maharashtra", pursePoints: 100 },
  { id: "cap-2", name: "Nova", tag: "NVA", region: "Delhi", pursePoints: 100 },
  { id: "cap-3", name: "Blaze", tag: "BLZ", region: "Karnataka", pursePoints: 100 }
];

export const auctionPlayers: AuctionPlayer[] = [
  { id: "p1", name: "ShadowOP", role: "Flexible", region: "UP", style: "Explosive entry" },
  { id: "p2", name: "ClutchBhai", role: "Support", region: "Punjab", style: "Late game closer" },
  { id: "p3", name: "ViperX", role: "Sniper", region: "Rajasthan", style: "Long-range punish" },
  { id: "p4", name: "Kraken", role: "Assaulter", region: "Gujarat", style: "Close quarter demon" },
  { id: "p5", name: "N1njaRonin", role: "IGL", region: "West Bengal", style: "Macro caller" },
  { id: "p6", name: "TurboMamba", role: "Assaulter", region: "Tamil Nadu", style: "High tempo fragger" },
  { id: "p7", name: "ScoutLite", role: "Support", region: "Bihar", style: "Utility master" },
  { id: "p8", name: "FuryLance", role: "Sniper", region: "Haryana", style: "Anchor sniper" },
  { id: "p9", name: "Hexa", role: "Flexible", region: "Kerala", style: "Adaptive playmaker" }
];

export const teams: Team[] = captains.map((c) => ({
  id: `team-${c.id}`,
  captainId: c.id,
  name: `${c.tag} Wolves`,
  playerIds: []
}));

export const announcements: Announcement[] = [
  {
    id: "a1",
    title: "Registrations now live",
    body: "Player onboarding and email verification is active. Complete your profile to enter scouting.",
    createdAt: "2026-04-15T12:00:00+05:30",
    priority: "high"
  },
  {
    id: "a2",
    title: "Auction room protocol",
    body: "Captains must lock selections inside 45 seconds per reveal.",
    createdAt: "2026-04-16T09:00:00+05:30",
    priority: "medium"
  }
];
