import { AuctionPlayer, AuctionState, Captain, Team } from "@/lib/types/models";

export interface AuctionRuntime {
  state: AuctionState;
  pot: AuctionPlayer[];
  currentPlayer?: AuctionPlayer;
  currentCaptainTurnIndex: number;
  teams: Team[];
  history: { playerId: string; captainId?: string }[];
  announcerLine: string;
}

function randomIndex(max: number) {
  if (max <= 1) return 0;
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return bytes[0] % max;
}

export function initializeAuction(players: AuctionPlayer[], teams: Team[]): AuctionRuntime {
  return {
    state: "waiting_draw",
    pot: [...players],
    currentCaptainTurnIndex: 0,
    teams: teams.map((t) => ({ ...t, playerIds: [] })),
    history: [],
    announcerLine: "Next player entering the auction pool..."
  };
}

export function setDrawingState(runtime: AuctionRuntime): AuctionRuntime {
  if (runtime.state === "complete" || runtime.pot.length === 0) {
    return { ...runtime, state: "complete", currentPlayer: undefined, announcerLine: "Auction lot draw complete." };
  }

  return {
    ...runtime,
    state: "drawing",
    announcerLine: "Next player entering the auction pool..."
  };
}

export function drawFromPot(runtime: AuctionRuntime, manualPlayerId?: string): AuctionRuntime {
  if (runtime.pot.length === 0) {
    return {
      ...runtime,
      state: "complete",
      currentPlayer: undefined,
      announcerLine: "All players have entered the auction."
    };
  }

  const selected = manualPlayerId
    ? runtime.pot.find((p) => p.id === manualPlayerId)
    : runtime.pot[randomIndex(runtime.pot.length)];

  if (!selected) return runtime;

  const nextPot = runtime.pot.filter((p) => p.id !== selected.id);

  return {
    ...runtime,
    state: "player_revealed",
    currentPlayer: selected,
    pot: nextPot,
    announcerLine: `Draw complete. ${selected.name} enters the auction.`
  };
}

export function beginAuctionForCurrent(runtime: AuctionRuntime): AuctionRuntime {
  if (!runtime.currentPlayer) return runtime;
  return {
    ...runtime,
    state: "in_auction",
    announcerLine: "Captains, prepare for the next selection."
  };
}

export function lockPick(runtime: AuctionRuntime, captains: Captain[], captainId: string): AuctionRuntime {
  if (!runtime.currentPlayer || runtime.state !== "in_auction") return runtime;
  const alreadyPicked = runtime.history.some((item) => item.playerId === runtime.currentPlayer?.id);
  if (alreadyPicked) return runtime;

  const nextTeams = runtime.teams.map((team) =>
    team.captainId === captainId ? { ...team, playerIds: [...team.playerIds, runtime.currentPlayer!.id] } : team
  );

  const nextTurn = captains.length ? (runtime.currentCaptainTurnIndex + 1) % captains.length : 0;

  return {
    ...runtime,
    state: runtime.pot.length === 0 ? "complete" : "auction_complete_for_player",
    teams: nextTeams,
    history: [...runtime.history, { playerId: runtime.currentPlayer.id, captainId }],
    currentCaptainTurnIndex: nextTurn,
    announcerLine: `${runtime.currentPlayer.name} sold. Awaiting next lot draw.`
  };
}

export function completeCurrentWithoutPick(runtime: AuctionRuntime): AuctionRuntime {
  if (!runtime.currentPlayer) return runtime;
  return {
    ...runtime,
    state: runtime.pot.length === 0 ? "complete" : "auction_complete_for_player",
    history: [...runtime.history, { playerId: runtime.currentPlayer.id }],
    announcerLine: `${runtime.currentPlayer.name} closed without a captain pick.`
  };
}

export function proceedToNext(runtime: AuctionRuntime): AuctionRuntime {
  if (runtime.state === "complete") return runtime;
  if (runtime.pot.length === 0) {
    return {
      ...runtime,
      state: "complete",
      currentPlayer: undefined,
      announcerLine: "Auction lot draw complete."
    };
  }

  return {
    ...runtime,
    state: "waiting_draw",
    currentPlayer: undefined,
    announcerLine: "Next player entering the auction pool..."
  };
}
