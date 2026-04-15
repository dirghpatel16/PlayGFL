import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { supabaseAdminTable } from "@/lib/supabase/rest";
import { completionPercent } from "@/lib/profile/completion";

export async function GET() {
  const authUser = await getSessionUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await supabaseAdminTable<any[]>(`player_profiles?user_id=eq.${authUser.id}&select=*`);
  if (!rows.length) {
    const empty = {
      user_id: authUser.id,
      preferred_roles: [],
      completion_percent: 0,
      approved: false,
      stats: {},
      trial_registered: false,
      shortlisted: false,
      auction_pool: false
    };
    const created = await supabaseAdminTable<any[]>("player_profiles", { method: "POST", body: JSON.stringify([empty]) });
    return NextResponse.json({ profile: created[0] ?? empty, emailVerified: Boolean(authUser.email_confirmed_at) });
  }

  return NextResponse.json({ profile: rows[0], emailVerified: Boolean(authUser.email_confirmed_at) });
}

export async function PUT(req: NextRequest) {
  const authUser = await getSessionUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!authUser.email_confirmed_at) {
    return NextResponse.json({ error: "Verify your email before updating league profile" }, { status: 403 });
  }

  const payload = await req.json();
  const completion = completionPercent(payload);
  const next = {
    ...payload,
    user_id: authUser.id,
    completion_percent: completion
  };

  const updated = await supabaseAdminTable<any[]>(`player_profiles?user_id=eq.${authUser.id}`, {
    method: "PATCH",
    body: JSON.stringify(next)
  }).catch(async () =>
    supabaseAdminTable<any[]>("player_profiles", {
      method: "POST",
      body: JSON.stringify([next])
    })
  );

  return NextResponse.json({ profile: updated[0] ?? next });
}
