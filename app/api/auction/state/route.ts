import { NextRequest, NextResponse } from "next/server";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { getAuctionSnapshot, runAuctionAction, AuctionAction } from "@/lib/auction/db";
import { isSupabaseConfigured } from "@/lib/supabase/rest";
import { auctionAction, getAuctionState } from "@/lib/server/state";
import { requireAdminUser } from "@/lib/auth/permissions";

const allowedActions = new Set(["start", "set_drawing", "draw_next", "open_selection", "pick", "next", "reset", "close"] as const);

export async function GET() {
  if (isSupabaseConfigured()) {
    const snapshot = await getAuctionSnapshot();
    return NextResponse.json(snapshot ?? { state: "waiting", pot: [], teams: [], history: [], announcerLine: "No active auction session" });
  }

  return NextResponse.json(getAuctionState());
}

export async function POST(req: NextRequest) {
  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const action = asNonEmptyString(body.action) as AuctionAction | null;
  const captainId = asNonEmptyString(body.captainId) ?? undefined;
  const manualPlayerId = asNonEmptyString(body.manualPlayerId) ?? undefined;

  if (!action || !allowedActions.has(action)) return badRequest("Invalid auction action");

  if (isSupabaseConfigured()) {
    const authz = await requireAdminUser();
    if (!authz.ok) return NextResponse.json({ error: authz.reason }, { status: 403 });

    await runAuctionAction(action, captainId, manualPlayerId);
    const snapshot = await getAuctionSnapshot();
    return NextResponse.json(snapshot);
  }

  const next = auctionAction(
    action === "start" ? "next" : action === "close" ? "next" : (action as any),
    captainId,
    manualPlayerId
  );
  return NextResponse.json(next);
}
