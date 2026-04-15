import { AuctionPlayer, Captain, Team, Tournament, Announcement } from "@/lib/types/models";
import { initializeAuction, startReveal, beginSelection, lockPick, proceedToNext, AuctionRuntime } from "@/lib/services/auction";

const tournament: Tournament = {
  id: "gfl-s1",
  name: "GFL Season 1",
  game: "BGMI",
  timezone: "Asia/Kolkata",
  launchAtIST: "2026-04-15T18:00:00+05:30",
  startsAtIST: "2026-04-18T21:00:00+05:30",
  registrationOpen: true,
  prizePoolINR: 50000,
  format: "3 captains draft auction players"
};

interface RuntimeState {
  captains: Captain[];
  players: AuctionPlayer[];
  teams: Team[];
  announcements: Announcement[];
  auction: AuctionRuntime;
}

const state: RuntimeState = {
  captains: [],
  players: [],
  teams: [],
  announcements: [],
  auction: initializeAuction([], [])
};

function rebuildAuction() {
  state.auction = initializeAuction(state.players.filter((p) => !p.soldToCaptainId), state.teams);
}

export function getPublicState() {
  return {
    tournament,
    captains: state.captains,
    players: state.players,
    teams: state.teams,
    announcements: state.announcements
  };
}

export function addCaptain(payload: Omit<Captain, "id">) {
  const captain: Captain = { id: crypto.randomUUID(), ...payload };
  state.captains.push(captain);
  state.teams.push({ id: crypto.randomUUID(), captainId: captain.id, name: `${captain.tag} Squad`, playerIds: [] });
  rebuildAuction();
  return captain;
}

export function addPlayer(payload: Omit<AuctionPlayer, "id">) {
  const player: AuctionPlayer = { id: crypto.randomUUID(), ...payload };
  state.players.push(player);
  rebuildAuction();
  return player;
}

export function addTeam(name: string, captainId: string) {
  const team: Team = { id: crypto.randomUUID(), name, captainId, playerIds: [] };
  state.teams.push(team);
  rebuildAuction();
  return team;
}

export function addAnnouncement(payload: Omit<Announcement, "id" | "createdAt">) {
  const announcement: Announcement = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...payload
  };
  state.announcements.unshift(announcement);
  return announcement;
}

export function getAuctionState() {
  return state.auction;
}

export function auctionAction(action: "start_reveal" | "open_selection" | "pick" | "next" | "reset", captainId?: string) {
  if (action === "start_reveal") state.auction = startReveal(state.auction);
  if (action === "open_selection") state.auction = beginSelection(state.auction);
  if (action === "pick" && captainId) {
    state.auction = lockPick(state.auction, state.captains, captainId);
    state.players = state.players.map((p) =>
      p.id === state.auction.history[state.auction.history.length - 1]?.playerId
        ? { ...p, soldToCaptainId: captainId }
        : p
    );
    state.teams = state.auction.teams;
  }
  if (action === "next") state.auction = proceedToNext(state.auction);
  if (action === "reset") rebuildAuction();

  return state.auction;
}
