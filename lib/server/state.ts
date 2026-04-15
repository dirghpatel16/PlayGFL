import { AuctionPlayer, Captain, Team, Tournament, Announcement, User } from "@/lib/types/models";
import { initializeAuction, setDrawingState, drawFromPot, beginAuctionForCurrent, lockPick, completeCurrentWithoutPick, proceedToNext, AuctionRuntime } from "@/lib/services/auction";
import { LAUNCH_UNLOCK_AT_IST } from "@/lib/config/launch";

const tournament: Tournament = {
  id: "gfl-s1",
  name: "GFL Season 1",
  game: "BGMI",
  timezone: "Asia/Kolkata",
  launchAtIST: LAUNCH_UNLOCK_AT_IST,
  startsAtIST: "2026-04-18T21:00:00+05:30",
  registrationOpen: true,
  prizePoolINR: 50000,
  format: "3 captains draft auction players"
};

interface RuntimeUser extends User {
  password: string;
}

interface RuntimeState {
  captains: Captain[];
  players: AuctionPlayer[];
  teams: Team[];
  announcements: Announcement[];
  auction: AuctionRuntime;
  users: RuntimeUser[];
}

const state: RuntimeState = {
  captains: [],
  players: [],
  teams: [],
  announcements: [],
  auction: initializeAuction([], []),
  users: []
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

export function auctionAction(
  action: "set_drawing" | "draw_next" | "open_selection" | "pick" | "close_without_pick" | "next" | "reset",
  captainId?: string,
  manualPlayerId?: string
) {
  if (action === "set_drawing") state.auction = setDrawingState(state.auction);
  if (action === "draw_next") state.auction = drawFromPot(state.auction, manualPlayerId);
  if (action === "open_selection") state.auction = beginAuctionForCurrent(state.auction);
  if (action === "pick" && captainId) {
    state.auction = lockPick(state.auction, state.captains, captainId);
    state.players = state.players.map((p) =>
      p.id === state.auction.history[state.auction.history.length - 1]?.playerId
        ? { ...p, soldToCaptainId: captainId }
        : p
    );
    state.teams = state.auction.teams;
  }
  if (action === "close_without_pick") state.auction = completeCurrentWithoutPick(state.auction);
  if (action === "next") state.auction = proceedToNext(state.auction);
  if (action === "reset") rebuildAuction();

  return state.auction;
}


export function signupUser(username: string, email: string, password: string) {
  if (state.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { error: "Email already registered" as const };
  }

  const user: RuntimeUser = {
    id: crypto.randomUUID(),
    username,
    email,
    password,
    emailVerified: false,
    role: "player",
    createdAt: new Date().toISOString()
  };

  state.users.push(user);
  const { password: _password, ...safeUser } = user;
  return { user: safeUser };
}

export function loginUser(email: string, password: string) {
  const user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    return { error: "Invalid credentials" as const };
  }

  const { password: _password, ...safeUser } = user;
  return { user: { ...safeUser, emailVerified: true } };
}

export function hasUser(email: string) {
  return state.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
}
