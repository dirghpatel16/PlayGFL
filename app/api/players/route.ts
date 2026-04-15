import { NextRequest, NextResponse } from "next/server";
import { addPlayer, getPublicState } from "@/lib/server/state";

export async function GET() {
  return NextResponse.json({ players: getPublicState().players });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const created = addPlayer({
    name: body.name,
    role: body.role,
    region: body.region,
    style: body.style
  });
  return NextResponse.json(created, { status: 201 });
}
