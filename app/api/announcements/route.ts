import { NextRequest, NextResponse } from "next/server";
import { addAnnouncement, getPublicState } from "@/lib/server/state";

export async function GET() {
  return NextResponse.json({ announcements: getPublicState().announcements });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const created = addAnnouncement({
    title: body.title,
    body: body.body,
    priority: body.priority || "medium"
  });
  return NextResponse.json(created, { status: 201 });
}
