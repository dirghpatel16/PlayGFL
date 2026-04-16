import { NextRequest, NextResponse } from "next/server";
import { addPlayer, getPublicState, removePlayer } from "@/lib/server/state";
import { PreferredRole } from "@/lib/types/models";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { requireCommissionerRequest } from "@/lib/auth/commissioner";
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
  const blocked = requireCommissionerRequest(req);
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


export async function DELETE(req: NextRequest) {
  const blocked = requireCommissionerRequest(req);
  if (blocked) return blocked;

  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");
  const playerId = asNonEmptyString(body.playerId);
  if (!playerId) return badRequest("playerId is required");

  if (isSupabaseConfigured()) {
    await supabaseAdminTable(`auction_players?id=eq.${playerId}`, { method: "DELETE" });
    return NextResponse.json({ ok: true });
  }

  removePlayer(playerId);
  return NextResponse.json({ ok: true });
}
