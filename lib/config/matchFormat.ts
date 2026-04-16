export type RoundType = "normal" | "golden";

export interface SeasonMatchDefinition {
  matchNumber: number;
  block: number;
  cycle: 1 | 2;
  roundType: RoundType;
  map: string;
  label: string;
}

const blocks = [4, 5, 6, 4, 5, 6] as const;
const maps = ["Erangel", "Miramar", "Sanhok", "Rondo", "Livik", "Vikendi"] as const;

const defs: SeasonMatchDefinition[] = [];
let cursor = 1;

blocks.forEach((size, blockIndex) => {
  const cycle = blockIndex < 3 ? 1 : 2;
  for (let i = 1; i <= size; i += 1) {
    const roundType: RoundType = i === size ? "golden" : "normal";
    const map = roundType === "golden" ? "Rondo (Golden)" : maps[(cursor - 1) % maps.length];
    defs.push({
      matchNumber: cursor,
      block: blockIndex + 1,
      cycle,
      roundType,
      map,
      label: `Block ${blockIndex + 1} • Match ${cursor}`
    });
    cursor += 1;
  }
});

export const seasonMatchPlan = defs;
