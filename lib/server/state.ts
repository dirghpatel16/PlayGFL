import { AuctionPlayer, Captain, Team, Tournament, Announcement, User } from "@/lib/types/models";
import { initializeAuction, setDrawingState, drawFromPot, beginAuctionForCurrent, lockPick, completeCurrentWithoutPick, proceedToNext, AuctionRuntime } from "@/lib/services/auction";
import { LAUNCH_UNLOCK_AT_IST } from "@/lib/config/launch";
import { scoringConfig, seasonConfig } from "@/lib/config/season";

const tournament: Tournament = {
  id: "gfl-s1",
  name: "PlayGFL Season 2",
  game: "BGMI",
  timezone: "Asia/Kolkata",
  launchAtIST: LAUNCH_UNLOCK_AT_IST,
  startsAtIST: "2026-04-18T21:00:00+05:30",
  registrationOpen: true,
  prizePoolINR: seasonConfig.prizePool,
  format: "3 captains draft auction players"
};

export interface MatchResult {
  id: string;
  teamId: string;
  placement: 1 | 2 | 3;
  kills: number;
  isGoldenRound: boolean;
  nominatedPlayerKills?: number;
  bonusType?: "none" | "back_to_back" | "threepeat";
  createdAt: string;
}

export interface TeamStanding {
  teamId: string;
  teamName: string;
  placementPoints: number;
  killPoints: number;
  bonusPoints: number;
  goldenModifierPoints: number;
  totalPoints: number;
}

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
  payments: Record<string, { status: "unpaid" | "submitted" | "verified"; utr?: string; payerName?: string; screenshotName?: string; updatedAt: string }>;
  results: MatchResult[];
}

const state: RuntimeState = {
  captains: [],
  players: [],
  teams: [],
  announcements: [],
  auction: initializeAuction([], []),
  users: [],
  payments: {},
  results: []
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

export function removeCaptain(captainId: string) {
  state.captains = state.captains.filter((c) => c.id !== captainId);
  state.teams = state.teams.filter((t) => t.captainId !== captainId);
  rebuildAuction();
}

export function renameCaptain(captainId: string, name: string) {
  state.captains = state.captains.map((c) => (c.id === captainId ? { ...c, name } : c));
}

export function renameTeam(teamId: string, name: string) {
  state.teams = state.teams.map((t) => (t.id === teamId ? { ...t, name } : t));
}

export function addPlayer(payload: Omit<AuctionPlayer, "id">) {
  const player: AuctionPlayer = { id: crypto.randomUUID(), ...payload };
  state.players.push(player);
  rebuildAuction();
  return player;
}

export function removePlayer(playerId: string) {
  state.players = state.players.filter((p) => p.id !== playerId);
  state.teams = state.teams.map((t) => ({ ...t, playerIds: t.playerIds.filter((id) => id !== playerId) }));
  rebuildAuction();
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

export function setPayment(userId: string, details: { utr: string; payerName: string; screenshotName?: string }) {
  state.payments[userId] = { status: "submitted", ...details, updatedAt: new Date().toISOString() };
  return state.payments[userId];
}

export function verifyPayment(userId: string) {
  const existing = state.payments[userId];
  state.payments[userId] = { ...(existing ?? { updatedAt: new Date().toISOString() }), status: "verified", updatedAt: new Date().toISOString() };
  return state.payments[userId];
}

export function getPayment(userId: string) {
  return state.payments[userId] ?? { status: "unpaid", updatedAt: new Date().toISOString() };
}

export function addMatchResult(payload: Omit<MatchResult, "id" | "createdAt">) {
  const row: MatchResult = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...payload };
  state.results.unshift(row);
  return row;
}

export function getMatchResults() {
  return state.results;
}

export function getStandings() {
  const byTeam: Record<string, TeamStanding> = {};
  for (const team of state.teams) {
    byTeam[team.id] = {
      teamId: team.id,
      teamName: team.name,
      placementPoints: 0,
      killPoints: 0,
      bonusPoints: 0,
      goldenModifierPoints: 0,
      totalPoints: 0
    };
  }

  for (const result of state.results) {
    const team = byTeam[result.teamId];
    if (!team) continue;

    const placementPoints = result.isGoldenRound
      ? (result.placement === 1 ? scoringConfig.goldenRounds.placement.first : result.placement === 2 ? scoringConfig.goldenRounds.placement.second : scoringConfig.goldenRounds.placement.third)
      : (result.placement === 1 ? scoringConfig.normalRounds.placement.first : result.placement === 2 ? scoringConfig.normalRounds.placement.second : scoringConfig.normalRounds.placement.third);

    const killPoints = result.kills * scoringConfig.goldenRounds.killPoint;
    const multiplierPoints = result.isGoldenRound ? (result.nominatedPlayerKills ?? 0) * scoringConfig.goldenRounds.killPoint : 0;
    const bonusPoints = result.bonusType === "threepeat" ? scoringConfig.bonuses.threepeatChicken : result.bonusType === "back_to_back" ? scoringConfig.bonuses.backToBackChicken : 0;

    team.placementPoints += placementPoints;
    team.killPoints += killPoints;
    team.goldenModifierPoints += multiplierPoints;
    team.bonusPoints += bonusPoints;
    team.totalPoints += placementPoints + killPoints + multiplierPoints + bonusPoints;
  }

  return Object.values(byTeam).sort((a, b) => b.totalPoints - a.totalPoints);
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
