import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { supabaseAdminTable } from "@/lib/supabase/rest";

export async function POST() {
  const authUser = await getSessionUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!authUser.email_confirmed_at) return NextResponse.json({ error: "Verify account first" }, { status: 403 });

  const rows = await supabaseAdminTable<any[]>(`player_profiles?user_id=eq.${authUser.id}&select=completion_percent&limit=1`);
  const paymentRows = await supabaseAdminTable<any[]>(`payment_submissions?user_id=eq.${authUser.id}&select=status&limit=1`).catch(() => []);
  const completion = rows[0]?.completion_percent ?? 0;
  if (completion < 100) return NextResponse.json({ error: "Complete profile before registering for trials" }, { status: 400 });
  if ((paymentRows[0]?.status ?? "unpaid") !== "verified") return NextResponse.json({ error: "Entry fee payment must be verified before trials registration" }, { status: 400 });

  await supabaseAdminTable(`player_profiles?user_id=eq.${authUser.id}`, {
    method: "PATCH",
    body: JSON.stringify({ trial_registered: true })
  });

  return NextResponse.json({ ok: true });
}
