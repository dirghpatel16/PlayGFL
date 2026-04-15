import { NextRequest, NextResponse } from "next/server";
import { addCaptain, getPublicState } from "@/lib/server/state";

export async function GET() {
  return NextResponse.json({ captains: getPublicState().captains });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const created = addCaptain({
    name: body.name,
    tag: body.tag,
    region: body.region,
    pursePoints: Number(body.pursePoints || 100)
  });
  return NextResponse.json(created, { status: 201 });
}
