import { AuctionPlayer, Captain, Team, Tournament, Announcement, User } from "@/lib/types/models";
import { initializeAuction, setDrawingState, drawFromPot, beginAuctionForCurrent, lockPick, completeCurrentWithoutPick, proceedToNext, AuctionRuntime } from "@/lib/services/auction";
import { LAUNCH_UNLOCK_AT_IST } from "@/lib/config/launch";
import { matchPlan, scoringConfig, seasonConfig } from "@/lib/config/season";

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

export interface TeamMatchResultInput { teamId: string; placement: 1 | 2 | 3; kills: number; bonusType?: "none" | "back_to_back" | "threepeat"; nominatedPlayerKills?: number }
export interface MatchLog { id: string; matchNumber: number; block: number; roundType: "normal" | "golden"; map: string; winnerTeamId: string; teamResults: TeamMatchResultInput[]; createdAt: string }
export interface TeamStanding { teamId: string; teamName: string; matchesPlayed: number; wwcd: number; placementPoints: number; killPoints: number; bonusPoints: number; goldenBonusPoints: number; totalPoints: number }

interface RuntimeUser extends User { password: string }
interface PaymentEvent { status: "submitted" | "confirmed" | "rejected"; at: string; note?: string }
interface RuntimeState {
  captains: Captain[]; players: AuctionPlayer[]; teams: Team[]; announcements: Announcement[]; auction: AuctionRuntime; users: RuntimeUser[];
  payments: Record<string, { status: "unpaid" | "submitted" | "confirmed" | "rejected"; utr?: string; payerName?: string; screenshotName?: string; submittedAt?: string; updatedAt: string; history: PaymentEvent[] }>;
  matchLogs: MatchLog[];
}

const state: RuntimeState = { captains: [], players: [], teams: [], announcements: [], auction: initializeAuction([], []), users: [], payments: {}, matchLogs: [] };

function rebuildAuction() { state.auction = initializeAuction(state.players.filter((p) => !p.soldToCaptainId), state.teams); }
function teamName(teamId: string) { return state.teams.find((t) => t.id === teamId)?.name ?? teamId; }

export function calcTeamPoints(roundType: "normal" | "golden", result: TeamMatchResultInput) {
  const placementPoints = roundType === "golden"
    ? (result.placement === 1 ? scoringConfig.goldenRounds.placement.first : result.placement === 2 ? scoringConfig.goldenRounds.placement.second : scoringConfig.goldenRounds.placement.third)
    : (result.placement === 1 ? scoringConfig.normalRounds.placement.first : result.placement === 2 ? scoringConfig.normalRounds.placement.second : scoringConfig.normalRounds.placement.third);
  const killPoints = result.kills * scoringConfig.goldenRounds.killPoint;
  const bonusPoints = result.bonusType === "threepeat" ? scoringConfig.bonuses.threepeatChicken : result.bonusType === "back_to_back" ? scoringConfig.bonuses.backToBackChicken : 0;
  const goldenBonusPoints = roundType === "golden" ? (result.nominatedPlayerKills ?? 0) * scoringConfig.goldenRounds.nominatedMultiplier : 0;
  const totalPoints = placementPoints + killPoints + bonusPoints + goldenBonusPoints;
  return { placementPoints, killPoints, bonusPoints, goldenBonusPoints, totalPoints };
}

export function getPublicState() { return { tournament, captains: state.captains, players: state.players, teams: state.teams, announcements: state.announcements }; }
export function addCaptain(payload: Omit<Captain, "id">) { const captain: Captain = { id: crypto.randomUUID(), ...payload }; state.captains.push(captain); state.teams.push({ id: crypto.randomUUID(), captainId: captain.id, name: `${captain.tag} Squad`, playerIds: [] }); rebuildAuction(); return captain; }
export function removeCaptain(captainId: string) { state.captains = state.captains.filter((c) => c.id !== captainId); state.teams = state.teams.filter((t) => t.captainId !== captainId); rebuildAuction(); }
export function renameCaptain(captainId: string, name: string) { state.captains = state.captains.map((c) => (c.id === captainId ? { ...c, name } : c)); }
export function renameTeam(teamId: string, name: string) { state.teams = state.teams.map((t) => (t.id === teamId ? { ...t, name } : t)); }
export function addPlayer(payload: Omit<AuctionPlayer, "id">) { const player: AuctionPlayer = { id: crypto.randomUUID(), ...payload }; state.players.push(player); rebuildAuction(); return player; }
export function removePlayer(playerId: string) { state.players = state.players.filter((p) => p.id !== playerId); state.teams = state.teams.map((t) => ({ ...t, playerIds: t.playerIds.filter((id) => id !== playerId) })); rebuildAuction(); }
export function addTeam(name: string, captainId: string) { const team: Team = { id: crypto.randomUUID(), name, captainId, playerIds: [] }; state.teams.push(team); rebuildAuction(); return team; }
export function addAnnouncement(payload: Omit<Announcement, "id" | "createdAt">) { const announcement: Announcement = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...payload }; state.announcements.unshift(announcement); return announcement; }
export function getAuctionState() { return state.auction; }
export function auctionAction(action: "set_drawing" | "draw_next" | "open_selection" | "pick" | "close_without_pick" | "next" | "reset", captainId?: string, manualPlayerId?: string) {
  if (action === "set_drawing") state.auction = setDrawingState(state.auction);
  if (action === "draw_next") state.auction = drawFromPot(state.auction, manualPlayerId);
  if (action === "open_selection") state.auction = beginAuctionForCurrent(state.auction);
  if (action === "pick" && captainId) {
    state.auction = lockPick(state.auction, state.captains, captainId);
    state.players = state.players.map((p) => p.id === state.auction.history[state.auction.history.length - 1]?.playerId ? { ...p, soldToCaptainId: captainId } : p);
    state.teams = state.auction.teams;
  }
  if (action === "close_without_pick") state.auction = completeCurrentWithoutPick(state.auction);
  if (action === "next") state.auction = proceedToNext(state.auction);
  if (action === "reset") rebuildAuction();
  return state.auction;
}

export function setPayment(userId: string, details: { utr: string; payerName: string; screenshotName?: string }) { const now = new Date().toISOString(); state.payments[userId] = { ...(state.payments[userId] ?? { history: [], updatedAt: now }), status: "submitted", ...details, submittedAt: now, updatedAt: now, history: [...(state.payments[userId]?.history ?? []), { status: "submitted", at: now }] }; return state.payments[userId]; }
export function setPaymentStatus(userId: string, status: "unpaid" | "submitted" | "confirmed" | "rejected") { const now = new Date().toISOString(); const prev = state.payments[userId] ?? { history: [], updatedAt: now }; const event = status === "unpaid" ? "rejected" : status; const next = { ...prev, status, updatedAt: now, history: [...prev.history, { status: event, at: now }] }; if (status === "unpaid") { next.utr = undefined; next.payerName = undefined; next.screenshotName = undefined; } state.payments[userId] = next; return next; }
export function verifyPayment(userId: string) { return setPaymentStatus(userId, "confirmed"); }
export function getPayment(userId: string) { return state.payments[userId] ?? { status: "unpaid", updatedAt: new Date().toISOString(), history: [] }; }
export function getPaymentSubmissions(search = "") { const keyword = search.trim().toLowerCase(); const rows = Object.entries(state.payments).map(([userId, payment]) => { const user = state.users.find((u) => u.id === userId); return { user_id: userId, username: user?.username ?? "Unknown", status: payment.status, payer_name: payment.payerName, utr: payment.utr, screenshot_name: payment.screenshotName, submitted_at: payment.submittedAt, updated_at: payment.updatedAt, history: payment.history }; }); if (!keyword) return rows; return rows.filter((r) => `${r.username} ${r.payer_name ?? ""} ${r.utr ?? ""}`.toLowerCase().includes(keyword)); }
export function isUtrUsed(utr: string, exceptUserId?: string) { const key = utr.trim().toLowerCase(); return Object.entries(state.payments).some(([uid, p]) => uid !== exceptUserId && (p.utr ?? "").trim().toLowerCase() === key); }

export function addOrUpdateMatchLog(payload: Omit<MatchLog, "id" | "createdAt" | "block" | "winnerTeamId"> & { id?: string; block?: number; winnerTeamId?: string }) {
  const now = new Date().toISOString();
  const plan = matchPlan.find((m) => m.matchNumber === payload.matchNumber);
  const winnerTeamId = payload.winnerTeamId ?? payload.teamResults.find((t) => t.placement === 1)?.teamId ?? payload.teamResults[0]?.teamId ?? "";
  const row: MatchLog = { id: payload.id ?? crypto.randomUUID(), createdAt: now, block: payload.block ?? plan?.block ?? 1, roundType: payload.roundType, map: payload.map, matchNumber: payload.matchNumber, winnerTeamId, teamResults: payload.teamResults };
  const idx = state.matchLogs.findIndex((m) => m.matchNumber === row.matchNumber);
  if (idx >= 0) state.matchLogs[idx] = { ...state.matchLogs[idx], ...row };
  else state.matchLogs.push(row);
  state.matchLogs.sort((a, b) => a.matchNumber - b.matchNumber);
  return row;
}

export function getMatchLogs() { return state.matchLogs; }

export function getMatchLedger() {
  const running: Record<string, number> = Object.fromEntries(state.teams.map((t) => [t.id, 0]));
  return state.matchLogs.map((m) => {
    const entries = m.teamResults.map((tr) => {
      const points = calcTeamPoints(m.roundType, tr);
      running[tr.teamId] = (running[tr.teamId] ?? 0) + points.totalPoints;
      return { ...tr, teamName: teamName(tr.teamId), ...points, runningTotal: running[tr.teamId] };
    });
    return { ...m, winnerTeamName: teamName(m.winnerTeamId), entries };
  });
}

export function getStandings() {
  const byTeam: Record<string, TeamStanding> = {};
  for (const team of state.teams) byTeam[team.id] = { teamId: team.id, teamName: team.name, matchesPlayed: 0, wwcd: 0, placementPoints: 0, killPoints: 0, bonusPoints: 0, goldenBonusPoints: 0, totalPoints: 0 };
  for (const match of state.matchLogs) {
    for (const result of match.teamResults) {
      const team = byTeam[result.teamId];
      if (!team) continue;
      const p = calcTeamPoints(match.roundType, result);
      team.matchesPlayed += 1;
      if (result.placement === 1) team.wwcd += 1;
      team.placementPoints += p.placementPoints;
      team.killPoints += p.killPoints;
      team.bonusPoints += p.bonusPoints;
      team.goldenBonusPoints += p.goldenBonusPoints;
      team.totalPoints += p.totalPoints;
    }
  }
  return Object.values(byTeam).sort((a, b) => b.totalPoints - a.totalPoints);
}

export function signupUser(username: string, email: string, password: string) { if (state.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return { error: "Email already registered" as const }; const user: RuntimeUser = { id: crypto.randomUUID(), username, email, password, emailVerified: false, role: "player", createdAt: new Date().toISOString() }; state.users.push(user); const { password: _password, ...safeUser } = user; return { user: safeUser }; }
export function loginUser(email: string, password: string) { const user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase()); if (!user || user.password !== password) return { error: "Invalid credentials" as const }; const { password: _password, ...safeUser } = user; return { user: { ...safeUser, emailVerified: true } }; }
export function hasUser(email: string) { return state.users.some((u) => u.email.toLowerCase() === email.toLowerCase()); }
