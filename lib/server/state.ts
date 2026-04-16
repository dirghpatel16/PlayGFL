import { AuctionPlayer, Captain, Team, Tournament, Announcement, User } from "@/lib/types/models";
import { initializeAuction, setDrawingState, drawFromPot, beginAuctionForCurrent, lockPick, completeCurrentWithoutPick, proceedToNext, AuctionRuntime } from "@/lib/services/auction";
import { LAUNCH_UNLOCK_AT_IST } from "@/lib/config/launch";
import { scoringConfig, seasonConfig } from "@/lib/config/season";
import { RoundType, seasonMatchPlan } from "@/lib/config/matchFormat";

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

export type PaymentStatus = "unpaid" | "submitted" | "confirmed" | "rejected";

export interface PaymentEvent {
  id: string;
  status: PaymentStatus;
  note: string;
  at: string;
}

export interface TeamMatchResultInput {
  teamId: string;
  placement: number;
  kills: number;
  bonusType?: "none" | "back_to_back" | "threepeat";
  nominatedPlayerKills?: number;
}

export interface TeamMatchResult extends TeamMatchResultInput {
  placementPoints: number;
  killPoints: number;
  bonusPoints: number;
  goldenRoundBonus: number;
  totalPoints: number;
}

export interface MatchLog {
  id: string;
  matchNumber: number;
  block: number;
  cycle: 1 | 2;
  roundType: RoundType;
  map: string;
  winnerTeamId?: string;
  entries: TeamMatchResult[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamStanding {
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  placementPoints: number;
  killPoints: number;
  bonusPoints: number;
  goldenRoundBonus: number;
  totalPoints: number;
}

interface RuntimeUser extends User {
  password: string;
}

interface PaymentRecord {
  status: PaymentStatus;
  utr?: string;
  payerName?: string;
  screenshotName?: string;
  screenshotDataUrl?: string;
  submittedAt?: string;
  updatedAt: string;
  history: PaymentEvent[];
}

interface RuntimeState {
  captains: Captain[];
  players: AuctionPlayer[];
  teams: Team[];
  announcements: Announcement[];
  auction: AuctionRuntime;
  users: RuntimeUser[];
  payments: Record<string, PaymentRecord>;
  matchLogs: MatchLog[];
}

const state: RuntimeState = {
  captains: [],
  players: [],
  teams: [],
  announcements: [],
  auction: initializeAuction([], []),
  users: [],
  payments: {},
  matchLogs: []
};

function rebuildAuction() {
  state.auction = initializeAuction(state.players.filter((p) => !p.soldToCaptainId), state.teams);
}

function pointsForPlacement(roundType: RoundType, placement: number) {
  if (roundType === "golden") {
    if (placement === 1) return scoringConfig.goldenRounds.placement.first;
    if (placement === 2) return scoringConfig.goldenRounds.placement.second;
    if (placement === 3) return scoringConfig.goldenRounds.placement.third;
    return 0;
  }

  if (placement === 1) return scoringConfig.normalRounds.placement.first;
  if (placement === 2) return scoringConfig.normalRounds.placement.second;
  if (placement === 3) return scoringConfig.normalRounds.placement.third;
  return 0;
}

function buildPaymentEvent(status: PaymentStatus, note: string): PaymentEvent {
  return { id: crypto.randomUUID(), status, note, at: new Date().toISOString() };
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

export function submitPayment(userId: string, details: { utr: string; payerName: string; screenshotName: string; screenshotDataUrl?: string }) {
  const duplicate = Object.entries(state.payments).find(([id, payment]) => id !== userId && payment.utr === details.utr);
  if (duplicate) {
    return { error: "UTR already used by another submission" as const };
  }

  const now = new Date().toISOString();
  const existing = state.payments[userId];
  const nextHistory = [
    ...(existing?.history ?? []),
    buildPaymentEvent("submitted", "Payment proof submitted for verification")
  ];

  state.payments[userId] = {
    status: "submitted",
    utr: details.utr,
    payerName: details.payerName,
    screenshotName: details.screenshotName,
    screenshotDataUrl: details.screenshotDataUrl,
    submittedAt: now,
    updatedAt: now,
    history: nextHistory
  };

  return { payment: state.payments[userId] };
}

export function reviewPayment(userId: string, status: "confirmed" | "rejected") {
  const existing = state.payments[userId];
  const now = new Date().toISOString();
  const base: PaymentRecord = existing ?? { status: "unpaid", updatedAt: now, history: [] };
  const note = status === "confirmed" ? "Submission verified by commissioner" : "Submission rejected by commissioner";

  state.payments[userId] = {
    ...base,
    status,
    updatedAt: now,
    history: [...base.history, buildPaymentEvent(status, note)]
  };

  return state.payments[userId];
}

export function getPayment(userId: string): PaymentRecord {
  return state.payments[userId] ?? { status: "unpaid", updatedAt: new Date().toISOString(), history: [] };
}

export function getPaymentSubmissions(search = "") {
  const keyword = search.trim().toLowerCase();
  const rows = Object.entries(state.payments).map(([userId, payment]) => {
    const user = state.users.find((u) => u.id === userId);
    return {
      user_id: userId,
      username: user?.username ?? "Unknown",
      email: user?.email ?? "",
      status: payment.status,
      payer_name: payment.payerName,
      utr: payment.utr,
      screenshot_name: payment.screenshotName,
      screenshot_data_url: payment.screenshotDataUrl,
      submitted_at: payment.submittedAt,
      updated_at: payment.updatedAt,
      history: payment.history
    };
  });

  const filtered = keyword
    ? rows.filter((r) => `${r.username} ${r.payer_name ?? ""} ${r.utr ?? ""}`.toLowerCase().includes(keyword))
    : rows;

  return filtered.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
}

export function saveMatchResult(payload: { matchNumber: number; roundType: RoundType; map: string; entries: TeamMatchResultInput[] }) {
  const scheduleRef = seasonMatchPlan.find((m) => m.matchNumber === payload.matchNumber);
  if (!scheduleRef) return { error: "Match number out of range" as const };

  const now = new Date().toISOString();
  const normalizedEntries: TeamMatchResult[] = payload.entries.map((entry) => {
    const killPoints = entry.kills * scoringConfig.goldenRounds.killPoint;
    const placementPoints = pointsForPlacement(payload.roundType, entry.placement);
    const bonusPoints = entry.bonusType === "threepeat"
      ? scoringConfig.bonuses.threepeatChicken
      : entry.bonusType === "back_to_back"
      ? scoringConfig.bonuses.backToBackChicken
      : 0;
    const goldenRoundBonus = payload.roundType === "golden"
      ? (entry.nominatedPlayerKills ?? 0) * scoringConfig.goldenRounds.killPoint * (scoringConfig.goldenRounds.nominatedMultiplier - 1)
      : 0;
    const totalPoints = placementPoints + killPoints + bonusPoints + goldenRoundBonus;

    return {
      ...entry,
      bonusType: entry.bonusType ?? "none",
      nominatedPlayerKills: entry.nominatedPlayerKills ?? 0,
      placementPoints,
      killPoints,
      bonusPoints,
      goldenRoundBonus,
      totalPoints
    };
  });

  const winner = normalizedEntries.find((entry) => entry.placement === 1)?.teamId;
  const existing = state.matchLogs.find((m) => m.matchNumber === payload.matchNumber);

  const row: MatchLog = {
    id: existing?.id ?? crypto.randomUUID(),
    matchNumber: payload.matchNumber,
    block: scheduleRef.block,
    cycle: scheduleRef.cycle,
    roundType: payload.roundType,
    map: payload.map,
    winnerTeamId: winner,
    entries: normalizedEntries,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };

  state.matchLogs = [row, ...state.matchLogs.filter((m) => m.matchNumber !== payload.matchNumber)]
    .sort((a, b) => a.matchNumber - b.matchNumber);

  return { result: row };
}

export function getMatchResults() {
  return state.matchLogs;
}

export function getStandings() {
  const byTeam: Record<string, TeamStanding> = {};
  for (const team of state.teams) {
    byTeam[team.id] = {
      teamId: team.id,
      teamName: team.name,
      matchesPlayed: 0,
      placementPoints: 0,
      killPoints: 0,
      bonusPoints: 0,
      goldenRoundBonus: 0,
      totalPoints: 0
    };
  }

  for (const log of state.matchLogs) {
    for (const entry of log.entries) {
      const team = byTeam[entry.teamId];
      if (!team) continue;
      team.matchesPlayed += 1;
      team.placementPoints += entry.placementPoints;
      team.killPoints += entry.killPoints;
      team.bonusPoints += entry.bonusPoints;
      team.goldenRoundBonus += entry.goldenRoundBonus;
      team.totalPoints += entry.totalPoints;
    }
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
