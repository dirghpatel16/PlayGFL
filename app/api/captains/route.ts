import { NextRequest, NextResponse } from "next/server";
import { addCaptain, getPublicState } from "@/lib/server/state";
import { asNonEmptyString, badRequest, parseJSON, requireAdmin } from "@/lib/server/auth";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";

export async function GET() {
  if (isSupabaseConfigured()) {
    const captains = await supabaseAdminTable<any[]>("captains?select=*");
    return NextResponse.json({ captains: captains.map((c) => ({ id: c.id, name: c.name, tag: c.tag, region: c.region, pursePoints: c.purse_points })) });
  }
  return NextResponse.json({ captains: getPublicState().captains });
}

export async function POST(req: NextRequest) {
  const blocked = requireAdmin(req);
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
