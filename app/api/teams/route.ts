import { NextRequest, NextResponse } from "next/server";
import { addTeam, getPublicState } from "@/lib/server/state";
import { asNonEmptyString, badRequest, parseJSON, requireAdmin } from "@/lib/server/auth";

export async function GET() {
  return NextResponse.json({ teams: getPublicState().teams });
}

export async function POST(req: NextRequest) {
  const blocked = requireAdmin(req);
  if (blocked) return blocked;

  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const name = asNonEmptyString(body.name);
  const captainId = asNonEmptyString(body.captainId);

  if (!name || !captainId) {
    return badRequest("name and captainId are required");
  }

  const created = addTeam(name, captainId);
  return NextResponse.json(created, { status: 201 });
}
