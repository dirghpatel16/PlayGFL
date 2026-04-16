import { NextRequest, NextResponse } from "next/server";
import { addCaptain, getPublicState } from "@/lib/server/state";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { requireCommissionerRequest } from "@/lib/auth/commissioner";
import { removeCaptain, renameCaptain } from "@/lib/server/state";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";

export async function GET() {
  if (isSupabaseConfigured()) {
    const captains = await supabaseAdminTable<any[]>("captains?select=*");
    return NextResponse.json({ captains: captains.map((c) => ({ id: c.id, name: c.name, tag: c.tag, region: c.region, pursePoints: c.purse_points })) });
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
  const region = asNonEmptyString(body.region);

  if (!name || !tag || !region) return badRequest("name, tag and region are required");

  const purseValue = Number(body.pursePoints ?? 100);
  const pursePoints = Number.isFinite(purseValue) ? purseValue : 100;

  if (isSupabaseConfigured()) {
    const created = await supabaseAdminTable<any[]>("captains", {
      method: "POST",
      body: JSON.stringify([{ id: crypto.randomUUID(), name, tag, region, purse_points: pursePoints }])
    });
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
  const name = asNonEmptyString(body.name);
  if (!captainId || !name) return badRequest("captainId and name are required");

  if (isSupabaseConfigured()) {
    await supabaseAdminTable(`captains?id=eq.${captainId}`, { method: "PATCH", body: JSON.stringify({ name }) });
    return NextResponse.json({ ok: true });
  }

  renameCaptain(captainId, name);
  return NextResponse.json({ ok: true });
}
