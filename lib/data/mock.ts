import { Announcement, AuctionPlayer, Captain, Team, Tournament } from "@/lib/types/models";

// Deprecated static seeds kept only for schema/type compatibility.
// Runtime pages now use dynamic API-backed state from lib/server/state.ts.

export const tournament: Tournament = {
  id: "gfl-s1",
  name: "GFL Season 2",
  game: "BGMI",
  timezone: "Asia/Kolkata",
  launchAtIST: "2026-04-15T19:00:00+05:30",
  startsAtIST: "2026-04-18T21:00:00+05:30",
  registrationOpen: true,
  prizePoolINR: 150,
  format: "3 captains draft auction players"
};

export const captains: Captain[] = [];
export const auctionPlayers: AuctionPlayer[] = [];
export const teams: Team[] = [];
export const announcements: Announcement[] = [];
