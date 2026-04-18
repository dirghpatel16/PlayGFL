import { NextRequest, NextResponse } from "next/server";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { getAuctionSnapshot, runAuctionAction, AuctionAction } from "@/lib/auction/db";
import { isSupabaseConfigured } from "@/lib/supabase/rest";
import { auctionAction, getAuctionState } from "@/lib/server/state";
import { requireCommissionerRequest } from "@/lib/auth/commissioner";
import { getSessionUser } from "@/lib/auth/session";

const allowedActions = new Set(["start", "draw_next", "open_bidding", "bid", "hammer", "pick", "next", "reset", "close"] as const);
// All actions are commissioner-only — captains no longer self-bid
const commissionerOnlyActions = new Set(["start", "draw_next", "open_bidding", "bid", "hammer", "pick", "next", "reset", "close"]);

export async function GET() {
  if (isSupabaseConfigured()) {
    try {
      const snapshot = await getAuctionSnapshot();
      return NextResponse.json(snapshot ?? { state: "waiting", pot: [], teams: [], history: [], captains: [], announcerLine: "No active auction session" });
    } catch (e: any) {
      return NextResponse.json({ state: "waiting", pot: [], teams: [], history: [], captains: [], announcerLine: "Session error: " + (e?.message ?? "unknown") });
    }
  }
  return NextResponse.json(getAuctionState());
}

export async function POST(req: NextRequest) {
  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const action = asNonEmptyString(body.action) as AuctionAction | null;
  const captainId = asNonEmptyString(body.captainId) ?? undefined;
  const manualPlayerId = asNonEmptyString(body.manualPlayerId) ?? undefined;
  const bidAmount = body.bidAmount ? Number(body.bidAmount) : undefined;

  if (!action || !allowedActions.has(action)) return badRequest("Invalid auction action");

  if (isSupabaseConfigured()) {
    if (commissionerOnlyActions.has(action)) {
      const blocked = requireCommissionerRequest(req);
      if (blocked) return blocked;
    }

    try {
      await runAuctionAction(action, captainId, manualPlayerId, bidAmount);
      const snapshot = await getAuctionSnapshot();
      return NextResponse.json(snapshot);
    } catch (e: any) {
      return NextResponse.json({ error: e?.message ?? "Action failed" }, { status: 400 });
    }
  }

  const next = auctionAction(action === "start" ? "next" : action === "close" ? "next" : (action as any), captainId, manualPlayerId);
  return NextResponse.json(next);
}
