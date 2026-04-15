import { NextRequest, NextResponse } from "next/server";
import { auctionAction, getAuctionState } from "@/lib/server/state";

export async function GET() {
  return NextResponse.json(getAuctionState());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const next = auctionAction(body.action, body.captainId);
  return NextResponse.json(next);
}
