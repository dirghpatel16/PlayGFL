import { NextRequest, NextResponse } from "next/server";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";
import { runAuctionAction } from "@/lib/auction/db";
import { requireCommissionerRequest } from "@/lib/auth/commissioner";
import { renameTeam } from "@/lib/server/state";

export async function POST(req: NextRequest) {
  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const action = asNonEmptyString(body.action);
  if (!action) return badRequest("action is required");

  if (action === "reset_auction") {
    const ownerOnly = requireCommissionerRequest(req, "owner");
    if (ownerOnly) return ownerOnly;
  } else {
    const blocked = requireCommissionerRequest(req, "staff");
    if (blocked) return blocked;
  }

  if (action === "move_to_auction_pool") {
    const playerId = asNonEmptyString(body.playerId);
    const sessionId = asNonEmptyString(body.sessionId) || "11111111-1111-1111-1111-111111111111";
    if (!playerId) return badRequest("playerId is required");
    if (isSupabaseConfigured()) {
      await supabaseAdminTable("auction_pool", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify([{ session_id: sessionId, player_id: playerId, is_available: true }])
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "remove_from_auction_pool") {
    const playerId = asNonEmptyString(body.playerId);
    const sessionId = asNonEmptyString(body.sessionId) || "11111111-1111-1111-1111-111111111111";
    if (!playerId) return badRequest("playerId is required");
    if (isSupabaseConfigured()) await supabaseAdminTable(`auction_pool?session_id=eq.${sessionId}&player_id=eq.${playerId}`, { method: "DELETE" });
    return NextResponse.json({ ok: true });
  }

  if (action === "start_auction" || action === "close_auction" || action === "reset_auction") {
    if (isSupabaseConfigured()) {
      const mapped = action === "start_auction" ? "start" : action === "reset_auction" ? "reset" : "close";
      await runAuctionAction(mapped as any);
    }
    return NextResponse.json({ ok: true });
  }

  return badRequest("Unknown commissioner action");
}

export async function PATCH(req: NextRequest) {
  const blocked = requireCommissionerRequest(req, "staff");
  if (blocked) return blocked;

  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const teamId = asNonEmptyString(body.teamId);
  const name = asNonEmptyString(body.name);
  if (!teamId || !name) return badRequest("teamId and name are required");

  if (isSupabaseConfigured()) {
    await supabaseAdminTable(`teams?id=eq.${teamId}`, { method: "PATCH", body: JSON.stringify({ name }) });
  } else {
    renameTeam(teamId, name);
  }

  return NextResponse.json({ ok: true });
}
