import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/permissions";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";
import { runAuctionAction } from "@/lib/auction/db";

export async function POST(req: NextRequest) {
  const authz = await requireAdminUser();
  if (!authz.ok) return NextResponse.json({ error: authz.reason }, { status: 403 });

  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const action = asNonEmptyString(body.action);
  if (!action) return badRequest("action is required");

  if (action === "approve_player") {
    const userId = asNonEmptyString(body.userId);
    if (!userId) return badRequest("userId is required");
    await supabaseAdminTable(`player_profiles?user_id=eq.${userId}`, { method: "PATCH", body: JSON.stringify({ approved: true }) });
    return NextResponse.json({ ok: true });
  }

  if (action === "move_to_auction_pool") {
    const playerId = asNonEmptyString(body.playerId);
    const sessionId = asNonEmptyString(body.sessionId) || "11111111-1111-1111-1111-111111111111";
    if (!playerId) return badRequest("playerId is required");
    await supabaseAdminTable("auction_pool", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify([{ session_id: sessionId, player_id: playerId, is_available: true }])
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "update_tournament") {
    const id = asNonEmptyString(body.id) || "gfl-s1";
    const name = asNonEmptyString(body.name);
    const format = asNonEmptyString(body.format);
    if (!name || !format) return badRequest("name and format are required");
    await supabaseAdminTable(`tournaments?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ name, format }) });
    return NextResponse.json({ ok: true });
  }

  if (["start_auction", "reset_auction", "close_auction"].includes(action)) {
    const mapped = action === "start_auction" ? "start" : action === "reset_auction" ? "reset" : "close";
    await runAuctionAction(mapped as any);
    return NextResponse.json({ ok: true });
  }

  return badRequest("Unknown admin action");
}
