import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";
import { getStandings } from "@/lib/server/state";
import { scoringConfig } from "@/lib/config/season";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ standings: getStandings(), scoringConfig });
  }

  const teams = await supabaseAdminTable<any[]>("teams?select=id,name");
  const rows = await supabaseAdminTable<any[]>("match_results?select=team_id,placement_points,kill_points,bonus_points,golden_modifier_points,total_points").catch(() => []);

  const aggregate: Record<string, any> = {};
  for (const team of teams) {
    aggregate[team.id] = {
      teamId: team.id,
      teamName: team.name,
      placementPoints: 0,
      killPoints: 0,
      bonusPoints: 0,
      goldenModifierPoints: 0,
      totalPoints: 0
    };
  }
  for (const row of rows) {
    const t = aggregate[row.team_id];
    if (!t) continue;
    t.placementPoints += Number(row.placement_points ?? 0);
    t.killPoints += Number(row.kill_points ?? 0);
    t.bonusPoints += Number(row.bonus_points ?? 0);
    t.goldenModifierPoints += Number(row.golden_modifier_points ?? 0);
    t.totalPoints += Number(row.total_points ?? 0);
  }

  return NextResponse.json({ standings: Object.values(aggregate).sort((a: any, b: any) => b.totalPoints - a.totalPoints), scoringConfig });
}
