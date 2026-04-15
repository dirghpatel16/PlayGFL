import { AuctionPlayer, AuctionState, Captain, Team } from "@/lib/types/models";

export interface AuctionRuntime {
  state: AuctionState;
  queue: AuctionPlayer[];
  currentPlayer?: AuctionPlayer;
  currentCaptainTurnIndex: number;
  teams: Team[];
  history: { playerId: string; captainId: string }[];
}

export function shufflePlayers(players: AuctionPlayer[]): AuctionPlayer[] {
  return [...players].sort(() => Math.random() - 0.5);
}

export function initializeAuction(players: AuctionPlayer[], teams: Team[]): AuctionRuntime {
  return {
    state: "waiting",
    queue: shufflePlayers(players),
    currentCaptainTurnIndex: 0,
    teams: teams.map((t) => ({ ...t, playerIds: [] })),
    history: []
  };
}

export function startReveal(runtime: AuctionRuntime): AuctionRuntime {
  if (runtime.queue.length === 0) return { ...runtime, state: "complete", currentPlayer: undefined };
  return { ...runtime, state: "player_reveal", currentPlayer: runtime.queue[0] };
}

export function beginSelection(runtime: AuctionRuntime): AuctionRuntime {
  if (!runtime.currentPlayer) return runtime;
  return { ...runtime, state: "selection" };
}

export function lockPick(runtime: AuctionRuntime, captains: Captain[], captainId: string): AuctionRuntime {
  if (!runtime.currentPlayer || runtime.state !== "selection") return runtime;
  const alreadyPicked = runtime.history.some((item) => item.playerId === runtime.currentPlayer?.id);
  if (alreadyPicked) return runtime;

  const nextTeams = runtime.teams.map((team) =>
    team.captainId === captainId ? { ...team, playerIds: [...team.playerIds, runtime.currentPlayer!.id] } : team
  );

  const nextQueue = runtime.queue.slice(1);
  const nextTurn = (runtime.currentCaptainTurnIndex + 1) % captains.length;

  return {
    ...runtime,
    state: nextQueue.length === 0 ? "complete" : "sold",
    teams: nextTeams,
    queue: nextQueue,
    history: [...runtime.history, { playerId: runtime.currentPlayer.id, captainId }],
    currentCaptainTurnIndex: nextTurn
  };
}

export function proceedToNext(runtime: AuctionRuntime): AuctionRuntime {
  if (runtime.state === "complete") return runtime;
  if (runtime.queue.length === 0) return { ...runtime, state: "complete", currentPlayer: undefined };
  return { ...runtime, state: "player_reveal", currentPlayer: runtime.queue[0] };
}
