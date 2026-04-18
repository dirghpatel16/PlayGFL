import { NextRequest, NextResponse } from "next/server";
import { addCaptain, getPublicState } from "@/lib/server/state";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { requireCommissionerRequest } from "@/lib/auth/commissioner";
import { removeCaptain, renameCaptain } from "@/lib/server/state";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";

export async function GET() {
  if (isSupabaseConfigured()) {
    const captains = await supabaseAdminTable<any[]>("captains?select=*");
    return NextResponse.json({ captains: captains.map((c) => ({ id: c.id, name: c.name, tag: c.tag, region: c.region, pursePoints: c.purse_points, user_id: c.user_id ?? null })) });
  }
  return NextResponse.json({ captains: getPublicState().captains });
}

export async function POST(req: NextRequest) {
  const blocked = requireCommissionerRequest(req, "owner");
  if (blocked) return blocked;

  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const name = asNonEmptyString(body.name);
  const tag = asNonEmptyString(body.tag);
  const region = asNonEmptyString(body.region) ?? "";
  const userId = asNonEmptyString(body.user_id) ?? null;

  if (!name || !tag) return badRequest("name and tag are required");

  const purseValue = Number(body.pursePoints ?? 50);
  const pursePoints = Number.isFinite(purseValue) ? purseValue : 50;

  if (isSupabaseConfigured()) {
    const captainId = crypto.randomUUID();
    const created = await supabaseAdminTable<any[]>("captains", {
      method: "POST",
      body: JSON.stringify([{ id: captainId, user_id: userId, name, tag, region, purse_points: pursePoints }])
    });
    // Create an associated team for the captain automatically
    await supabaseAdminTable("teams", {
      method: "POST",
      body: JSON.stringify([{ id: crypto.randomUUID(), tournament_id: "gfl-s2", name: `Team ${tag}`, captain_id: captainId }])
    }).catch(() => null);
    return NextResponse.json(created[0], { status: 201 });
  }

  const created = addCaptain({ name, tag, region, pursePoints });
  return NextResponse.json(created, { status: 201 });
}


export async function DELETE(req: NextRequest) {
  const blocked = requireCommissionerRequest(req, "owner");
  if (blocked) return blocked;

  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");
  const captainId = asNonEmptyString(body.captainId);
  if (!captainId) return badRequest("captainId is required");

  if (isSupabaseConfigured()) {
    // Fetch captain before deleting so we can restore them to the pot
    const caps = await supabaseAdminTable<any[]>(`captains?id=eq.${captainId}&select=*`);
    const cap = caps[0];
    if (cap) {
      // Re-add to auction_players so they appear back in the pot
      const restoreId = cap.user_id || captainId;
      await supabaseAdminTable("auction_players", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify([{ id: restoreId, name: cap.name, role: "Captain", region: cap.region ?? "", style: "IGL" }])
      }).catch(() => null);
      // Delete their team
      await supabaseAdminTable(`teams?captain_id=eq.${captainId}`, { method: "DELETE" }).catch(() => null);
    }
    await supabaseAdminTable(`captains?id=eq.${captainId}`, { method: "DELETE" });
    return NextResponse.json({ ok: true });
  }

  removeCaptain(captainId);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const blocked = requireCommissionerRequest(req, "owner");
  if (blocked) return blocked;

  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");
  const captainId = asNonEmptyString(body.captainId);
  if (!captainId) return badRequest("captainId is required");

  if (isSupabaseConfigured()) {
    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = asNonEmptyString(body.name);
    if (body.user_id !== undefined) patch.user_id = body.user_id ? String(body.user_id) : null;
    if (!Object.keys(patch).length) return badRequest("No fields to update");
    await supabaseAdminTable(`captains?id=eq.${captainId}`, { method: "PATCH", body: JSON.stringify(patch) });
    return NextResponse.json({ ok: true });
  }

  if (body.name) renameCaptain(captainId, String(body.name));
  return NextResponse.json({ ok: true });
}
