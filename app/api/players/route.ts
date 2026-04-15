import { NextRequest, NextResponse } from "next/server";
import { addPlayer, getPublicState } from "@/lib/server/state";
import { PreferredRole } from "@/lib/types/models";
import { asNonEmptyString, badRequest, parseJSON, requireAdmin } from "@/lib/server/auth";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";

const allowedRoles = new Set<PreferredRole>(["Assaulter", "Support", "IGL", "Sniper", "Flexible"]);

export async function GET() {
  if (isSupabaseConfigured()) {
    const players = await supabaseAdminTable<any[]>("auction_players?select=*");
    return NextResponse.json({ players: players.map((p) => ({ id: p.id, name: p.name, role: p.role, region: p.region, style: p.style, soldToCaptainId: p.sold_to_captain_id })) });
  }
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

  if (!name || !role || !region || !style) return badRequest("name, role, region and style are required");
  if (!allowedRoles.has(role as PreferredRole)) return badRequest("Invalid role value");

  if (isSupabaseConfigured()) {
    const created = await supabaseAdminTable<any[]>("auction_players", {
      method: "POST",
      body: JSON.stringify([{ id: crypto.randomUUID(), name, role, region, style }])
    });
    return NextResponse.json(created[0], { status: 201 });
  }

  const created = addPlayer({ name, role: role as PreferredRole, region, style });
  return NextResponse.json(created, { status: 201 });
}
