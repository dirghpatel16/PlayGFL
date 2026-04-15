import { NextRequest, NextResponse } from "next/server";
import { addAnnouncement, getPublicState } from "@/lib/server/state";
import { Announcement } from "@/lib/types/models";
import { asNonEmptyString, badRequest, parseJSON, requireAdmin } from "@/lib/server/auth";

const allowedPriority = new Set<Announcement["priority"]>(["low", "medium", "high"]);

export async function GET() {
  return NextResponse.json({ announcements: getPublicState().announcements });
}

export async function POST(req: NextRequest) {
  const blocked = requireAdmin(req);
  if (blocked) return blocked;

  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const title = asNonEmptyString(body.title);
  const message = asNonEmptyString(body.body);
  const priority = (asNonEmptyString(body.priority) ?? "medium") as Announcement["priority"];

  if (!title || !message) {
    return badRequest("title and body are required");
  }

  if (!allowedPriority.has(priority)) {
    return badRequest("Invalid priority value");
  }

  const created = addAnnouncement({
    title,
    body: message,
    priority
  });

  return NextResponse.json(created, { status: 201 });
}
