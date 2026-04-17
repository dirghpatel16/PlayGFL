import { NextRequest, NextResponse } from "next/server";
import { addPlayer, getPublicState, removePlayer } from "@/lib/server/state";
import { PreferredRole } from "@/lib/types/models";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { requireCommissionerRequest } from "@/lib/auth/commissioner";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";

const allowedRoles = new Set<PreferredRole>(["Assaulter", "Support", "IGL", "Sniper", "Flexible"]);

export async function GET() {
  if (isSupabaseConfigured()) {
    const [registrations, profiles] = await Promise.all([
      supabaseAdminTable<any[]>("tournament_registrations?select=user_id,status,payment_status").catch(() => []),
      supabaseAdminTable<any[]>("player_profiles?select=user_id,username,bgmi_ign,bgmi_id,role_preference").catch(() => [])
    ]);

    const registeredIds = new Set(
      registrations
        .filter((r) => ["profile_completed", "payment_submitted", "registered"].includes(String(r.status)))
        .map((r) => r.user_id)
    );

    const players = profiles
      .filter((profile) => registeredIds.has(profile.user_id))
      .map((profile) => ({
        id: profile.user_id,
        name: profile.username || profile.bgmi_ign || "Unnamed",
        role: profile.role_preference || "Flexible",
        region: "",
        style: profile.bgmi_id || "",
        soldToCaptainId: undefined,
        bgmiIgn: profile.bgmi_ign,
        bgmiId: profile.bgmi_id
      }));

    return NextResponse.json({ players });
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
