import { NextRequest, NextResponse } from "next/server";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { requireCommissionerRequest } from "@/lib/auth/commissioner";
import { addOrUpdateMatchLog, getMatchLogs } from "@/lib/server/state";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";
import { matchPlan } from "@/lib/config/season";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ matches: getMatchLogs(), plan: matchPlan });
  const rows = await supabaseAdminTable<any[]>("match_results?select=*&order=match_number.asc").catch(() => []);
  return NextResponse.json({ matches: rows, plan: matchPlan });
}

export async function POST(req: NextRequest) {
  const blocked = requireCommissionerRequest(req, "staff");
  if (blocked) return blocked;

  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const matchNumber = Number(body.matchNumber);
  const roundType = asNonEmptyString(body.roundType) as "normal" | "golden" | null;
  const map = asNonEmptyString(body.map) ?? "Erangel";
  const winnerTeamId = asNonEmptyString(body.winnerTeamId);
  const teamResults = Array.isArray(body.teamResults) ? body.teamResults : [];

  if (!Number.isFinite(matchNumber) || matchNumber < 1 || matchNumber > 30) return badRequest("matchNumber must be between 1 and 30");
  if (!roundType || !["normal", "golden"].includes(roundType)) return badRequest("roundType is required");
  const plan = matchPlan.find((m) => m.matchNumber === matchNumber);
  if (plan && plan.roundType !== roundType) return badRequest(`Match ${matchNumber} must be ${plan.roundType}`);
  if (!winnerTeamId) return badRequest("winnerTeamId is required");
  if (!teamResults.length) return badRequest("teamResults are required");

  const normalized = teamResults.map((r: any) => ({
    teamId: asNonEmptyString(r.teamId),
    placement: Number(r.placement),
    kills: Number(r.kills ?? 0),
    bonusType: (asNonEmptyString(r.bonusType) ?? "none") as any,
    nominatedPlayerKills: Number(r.nominatedPlayerKills ?? 0)
  }));

  if (normalized.some((r: any) => !r.teamId || ![1, 2, 3].includes(r.placement))) return badRequest("Each team result must include teamId and placement 1/2/3");

  if (isSupabaseConfigured()) {
    const payload = { match_number: matchNumber, round_type: roundType, map, winner_team_id: winnerTeamId, team_results: normalized };
    const row = await supabaseAdminTable<any[]>("match_results", { method: "POST", body: JSON.stringify([payload]) });
    return NextResponse.json({ result: row[0] ?? payload }, { status: 201 });
  }

  const result = addOrUpdateMatchLog({ matchNumber, roundType, map, winnerTeamId, teamResults: normalized as any, block: plan?.block ?? 1 });
  return NextResponse.json({ result }, { status: 201 });
}
