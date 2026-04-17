import { NextRequest, NextResponse } from "next/server";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { requireCommissionerRequest } from "@/lib/auth/commissioner";
import { saveMatchResult, TeamMatchResultInput } from "@/lib/server/state";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";

export async function POST(req: NextRequest) {
  const blocked = requireCommissionerRequest(req);
  if (blocked) return blocked;

  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const matchNumber = Number(body.matchNumber);
  const roundType = asNonEmptyString(body.roundType) === "golden" ? "golden" : "normal";
  const map = asNonEmptyString(body.map) ?? "Unknown";
  const entries = Array.isArray(body.entries) ? body.entries : [];

  if (!Number.isInteger(matchNumber) || matchNumber < 1 || matchNumber > 30) {
    return badRequest("matchNumber must be between 1 and 30");
  }
  if (!entries.length) return badRequest("entries are required");

  const normalizedEntries: TeamMatchResultInput[] = [];
  for (const entry of entries) {
    const teamId = asNonEmptyString(entry?.teamId);
    const placement = Number(entry?.placement);
    const kills = Number(entry?.kills ?? 0);
    const bonusType = asNonEmptyString(entry?.bonusType) ?? "none";
    const nominatedPlayerKills = Number(entry?.nominatedPlayerKills ?? 0);

    if (!teamId || !Number.isFinite(placement) || !Number.isFinite(kills)) continue;
    normalizedEntries.push({ teamId, placement, kills, bonusType: bonusType as any, nominatedPlayerKills });
  }

  if (!normalizedEntries.length) return badRequest("valid team entries are required");

  if (isSupabaseConfigured()) {
    await supabaseAdminTable(`match_results?match_number=eq.${matchNumber}`, { method: "DELETE" }).catch(() => null);

    const rows = normalizedEntries.map((entry) => ({
      team_id: entry.teamId,
      match_number: matchNumber,
      round_type: roundType,
      map,
      placement: entry.placement,
      kills: entry.kills,
      bonus_type: entry.bonusType,
      nominated_player_kills: entry.nominatedPlayerKills,
      is_golden_round: roundType === "golden"
    }));

    const created = await supabaseAdminTable<any[]>("match_results", {
      method: "POST",
      body: JSON.stringify(rows)
    });

    return NextResponse.json({ result: { matchNumber, roundType, map, entries: created } }, { status: 201 });
  }

  const result = saveMatchResult({
    matchNumber,
    roundType,
    map,
    entries: normalizedEntries
  });

  if ("error" in result) return badRequest(result.error ?? "Unable to save result");

  return NextResponse.json(result, { status: 201 });
}
