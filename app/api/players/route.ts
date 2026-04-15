import { NextRequest, NextResponse } from "next/server";
import { addPlayer, getPublicState } from "@/lib/server/state";
import { PreferredRole } from "@/lib/types/models";
import { asNonEmptyString, badRequest, parseJSON, requireAdmin } from "@/lib/server/auth";

const allowedRoles = new Set<PreferredRole>(["Assaulter", "Support", "IGL", "Sniper", "Flexible"]);

export async function GET() {
  return NextResponse.json({ players: getPublicState().players });
}

export async function POST(req: NextRequest) {
  const blocked = requireAdmin(req);
  if (blocked) return blocked;

  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const name = asNonEmptyString(body.name);
  const role = asNonEmptyString(body.role);
  const region = asNonEmptyString(body.region);
  const style = asNonEmptyString(body.style);

  if (!name || !role || !region || !style) {
    return badRequest("name, role, region and style are required");
  }

  if (!allowedRoles.has(role as PreferredRole)) {
    return badRequest("Invalid role value");
  }

  const created = addPlayer({
    name,
    role: role as PreferredRole,
    region,
    style
  });

  return NextResponse.json(created, { status: 201 });
}
