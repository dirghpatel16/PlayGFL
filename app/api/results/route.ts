import { NextRequest, NextResponse } from "next/server";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { requireCommissionerRequest } from "@/lib/auth/commissioner";
import { addMatchResult } from "@/lib/server/state";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";
import { scoringConfig } from "@/lib/config/season";

export async function POST(req: NextRequest) {
  const blocked = requireCommissionerRequest(req);
  if (blocked) return blocked;

  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const teamId = asNonEmptyString(body.teamId);
  const placement = Number(body.placement);
  const kills = Number(body.kills ?? 0);
  const isGoldenRound = Boolean(body.isGoldenRound);
  const nominatedPlayerKills = Number(body.nominatedPlayerKills ?? 0);
  const bonusType = asNonEmptyString(body.bonusType) ?? "none";

  if (!teamId || ![1, 2, 3].includes(placement)) return badRequest("teamId and placement (1/2/3) are required");

  const placementPoints = isGoldenRound
    ? (placement === 1 ? scoringConfig.goldenRounds.placement.first : placement === 2 ? scoringConfig.goldenRounds.placement.second : scoringConfig.goldenRounds.placement.third)
    : (placement === 1 ? scoringConfig.normalRounds.placement.first : placement === 2 ? scoringConfig.normalRounds.placement.second : scoringConfig.normalRounds.placement.third);
  const killPoints = kills;
  const goldenModifierPoints = isGoldenRound ? nominatedPlayerKills * scoringConfig.goldenRounds.killPoint : 0;
  const bonusPoints = bonusType === "threepeat" ? scoringConfig.bonuses.threepeatChicken : bonusType === "back_to_back" ? scoringConfig.bonuses.backToBackChicken : 0;
  const totalPoints = placementPoints + killPoints + goldenModifierPoints + bonusPoints;

  if (isSupabaseConfigured()) {
    const row = await supabaseAdminTable<any[]>("match_results", {
      method: "POST",
      body: JSON.stringify([{
        team_id: teamId,
        placement,
        kills,
        is_golden_round: isGoldenRound,
        nominated_player_kills: nominatedPlayerKills,
        bonus_type: bonusType,
        placement_points: placementPoints,
        kill_points: killPoints,
        bonus_points: bonusPoints,
        golden_modifier_points: goldenModifierPoints,
        total_points: totalPoints
      }])
    });
    return NextResponse.json({ result: row[0] }, { status: 201 });
  }

  const result = addMatchResult({
    teamId,
    placement: placement as 1 | 2 | 3,
    kills,
    isGoldenRound,
    nominatedPlayerKills,
    bonusType: bonusType as any
  });
  return NextResponse.json({ result }, { status: 201 });
}
