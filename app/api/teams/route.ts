import { NextRequest, NextResponse } from "next/server";
import { addTeam, getPublicState } from "@/lib/server/state";

export async function GET() {
  return NextResponse.json({ teams: getPublicState().teams });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const created = addTeam(body.name, body.captainId);
  return NextResponse.json(created, { status: 201 });
}
