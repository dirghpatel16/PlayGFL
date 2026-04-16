import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";
import { getMatchResults, getStandings } from "@/lib/server/state";
import { scoringConfig } from "@/lib/config/season";
import { seasonMatchPlan } from "@/lib/config/matchFormat";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ standings: getStandings(), matchLogs: getMatchResults(), seasonMatchPlan, scoringConfig });
  }

  const teams = await supabaseAdminTable<any[]>("teams?select=id,name");
  const rows = await supabaseAdminTable<any[]>("match_results?select=*").catch(() => []);

  const aggregate: Record<string, any> = {};
  for (const team of teams) {
    aggregate[team.id] = {
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

  for (const row of rows) {
    const t = aggregate[row.team_id];
    if (!t) continue;
    t.matchesPlayed += 1;
    t.placementPoints += Number(row.placement_points ?? 0);
    t.killPoints += Number(row.kill_points ?? 0);
    t.bonusPoints += Number(row.bonus_points ?? 0);
    t.goldenRoundBonus += Number(row.golden_round_bonus ?? row.golden_modifier_points ?? 0);
    t.totalPoints += Number(row.total_points ?? 0);
  }

  return NextResponse.json({
    standings: Object.values(aggregate).sort((a: any, b: any) => b.totalPoints - a.totalPoints),
    matchLogs: [],
    seasonMatchPlan,
    scoringConfig
  });
}
