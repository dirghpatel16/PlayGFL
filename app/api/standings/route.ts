import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";
import { calcTeamPoints, getMatchLedger, getMatchLogs, getStandings } from "@/lib/server/state";
import { matchPlan } from "@/lib/config/season";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ overall: getStandings(), ledger: getMatchLedger(), rawLogs: getMatchLogs(), plan: matchPlan });
  }

  const teams = await supabaseAdminTable<any[]>("teams?select=id,name").catch(() => []);
  const raw = await supabaseAdminTable<any[]>("match_results?select=*&order=match_number.asc").catch(() => []);
  const logs = raw.map((m) => ({ id: m.id, matchNumber: m.match_number, block: matchPlan.find((x) => x.matchNumber === m.match_number)?.block ?? 1, roundType: m.round_type, map: m.map, winnerTeamId: m.winner_team_id, teamResults: m.team_results ?? [] }));

  const summary: Record<string, any> = {};
  teams.forEach((t) => summary[t.id] = { teamId: t.id, teamName: t.name, matchesPlayed: 0, wwcd: 0, placementPoints: 0, killPoints: 0, bonusPoints: 0, goldenBonusPoints: 0, totalPoints: 0 });
  const running: Record<string, number> = Object.fromEntries(teams.map((t) => [t.id, 0]));

  const ledger = logs.map((m: any) => {
    const entries = (Array.isArray(m.teamResults) ? m.teamResults : []).map((r: any) => {
      const points = calcTeamPoints(m.roundType, r);
      const s = summary[r.teamId];
      if (s) {
        s.matchesPlayed += 1;
        if (Number(r.placement) === 1) s.wwcd += 1;
        s.placementPoints += points.placementPoints;
        s.killPoints += points.killPoints;
        s.bonusPoints += points.bonusPoints;
        s.goldenBonusPoints += points.goldenBonusPoints;
        s.totalPoints += points.totalPoints;
      }
      running[r.teamId] = (running[r.teamId] ?? 0) + points.totalPoints;
      return { ...r, ...points, runningTotal: running[r.teamId], teamName: teams.find((t) => t.id === r.teamId)?.name ?? r.teamId };
    });
    return { ...m, winnerTeamName: teams.find((t) => t.id === m.winnerTeamId)?.name ?? m.winnerTeamId, entries };
  });

  return NextResponse.json({ overall: Object.values(summary).sort((a: any, b: any) => b.totalPoints - a.totalPoints), ledger, rawLogs: logs, plan: matchPlan });
}
