import { NextRequest, NextResponse } from "next/server";
import { auctionAction, getAuctionState } from "@/lib/server/state";
import { asNonEmptyString, badRequest, parseJSON, requireAdmin } from "@/lib/server/auth";

const allowedActions = new Set([
  "set_drawing",
  "draw_next",
  "open_selection",
  "pick",
  "close_without_pick",
  "next",
  "reset"
] as const);

type AuctionAction = "set_drawing" | "draw_next" | "open_selection" | "pick" | "close_without_pick" | "next" | "reset";

export async function GET() {
  return NextResponse.json(getAuctionState());
}

export async function POST(req: NextRequest) {
  const blocked = requireAdmin(req);
  if (blocked) return blocked;

  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const action = asNonEmptyString(body.action) as AuctionAction | null;
  const captainId = asNonEmptyString(body.captainId) ?? undefined;
  const manualPlayerId = asNonEmptyString(body.manualPlayerId) ?? undefined;

  if (!action || !allowedActions.has(action)) {
    return badRequest("Invalid auction action");
  }

  const next = auctionAction(action, captainId, manualPlayerId);
  return NextResponse.json(next);
}
