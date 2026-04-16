export const seasonConfig = {
  brand: "GFL",
  seasonLabel: "Season 2",
  totalPlayers: 12,
  captains: 3,
  auctionPlayers: 9,
  matches: 30,
  entryFee: 50,
  prizePool: 150,
  prizes: {
    first: 75,
    second: 45,
    third: 30
  },
  timing: "9:00 PM to 12:00 AM IST"
} as const;

export const scoringConfig = {
  normalRounds: {
    gamesPerRound: 4,
    placement: { first: 10, second: 6, third: 3 }
  },
  bonuses: {
    backToBackChicken: 5,
    threepeatChicken: 10
  },
  goldenRounds: {
    map: "Rondo (Small Recall Compound)",
    placement: { first: 15, second: 10, third: 5 },
    killPoint: 1,
    nominatedMultiplier: 2
  }
} as const;
