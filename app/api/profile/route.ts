import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { supabaseAdminTable } from "@/lib/supabase/rest";
import { seasonConfig } from "@/lib/config/season";

const paymentLabel = (status: string) => status === "confirmed" ? "Payment Confirmed" : status === "submitted" ? "Payment Submitted" : status === "rejected" ? "Rejected" : "Unpaid";

function completionPercent(profile: { username?: string | null; bgmi_ign?: string | null; bgmi_id?: string | null; role_preference?: string | null }) {
  const fields = [profile.username, profile.bgmi_ign, profile.bgmi_id, profile.role_preference];
  const completed = fields.filter((value) => String(value || "").trim().length > 0).length;
  return Math.round((completed / fields.length) * 100);
}

export async function GET() {
  const authUser = await getSessionUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [rows, paymentRows, registrationRows] = await Promise.all([
    supabaseAdminTable<any[]>(`player_profiles?user_id=eq.${authUser.id}&select=*`).catch(() => []),
    supabaseAdminTable<any[]>(`payment_submissions?user_id=eq.${authUser.id}&select=status&limit=1`).catch(() => []),
    supabaseAdminTable<any[]>(`tournament_registrations?user_id=eq.${authUser.id}&select=status&limit=1`).catch(() => [])
  ]);

  if (!rows.length) {
    const empty = {
      user_id: authUser.id,
      username: authUser.username ?? authUser.email?.split("@")[0] ?? "",
      bgmi_ign: "",
      bgmi_id: "",
      role_preference: "",
      completion_percent: 0
    };
    const created = await supabaseAdminTable<any[]>("player_profiles", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify([empty])
    }).catch(() => [empty]);

    return NextResponse.json({
      profile: created[0] ?? empty,
      paymentStatus: paymentRows[0]?.status ?? "unpaid",
      paymentLabel: paymentLabel(paymentRows[0]?.status ?? "unpaid"),
      registrationStatus: registrationRows[0]?.status === "registered" ? "Registered for GFL Season 2" : "Not Registered",
      entryFee: seasonConfig.entryFee
    });
  }

  const paymentStatus = paymentRows[0]?.status ?? "unpaid";
  const registrationStatus = registrationRows[0]?.status === "registered" ? "Registered for GFL Season 2" : "Not Registered";

  return NextResponse.json({
    profile: rows[0],
    paymentStatus,
    paymentLabel: paymentLabel(paymentStatus),
    registrationStatus,
    entryFee: seasonConfig.entryFee
  });
}

export async function PUT(req: NextRequest) {
  const authUser = await getSessionUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!authUser.emailVerified) {
    return NextResponse.json({ error: "Verify your account before updating profile" }, { status: 403 });
  }

  const payload = await req.json();
  const next = {
    user_id: authUser.id,
    username: String(payload.username ?? "").trim(),
    bgmi_ign: String(payload.bgmi_ign ?? "").trim(),
    bgmi_id: String(payload.bgmi_id ?? "").trim(),
    role_preference: String(payload.role_preference ?? "").trim()
  };

  if (!next.username || !next.bgmi_ign || !next.bgmi_id || !next.role_preference) {
    return NextResponse.json({ error: "username, BGMI IGN, BGMI ID, and role preference are required" }, { status: 400 });
  }

  const completion = completionPercent(next);
  const profilePayload = { ...next, completion_percent: completion, updated_at: new Date().toISOString() };

  const [updated] = await Promise.all([
    supabaseAdminTable<any[]>("player_profiles", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify([profilePayload])
    }).catch(() => [profilePayload]),
    supabaseAdminTable<any[]>("tournament_registrations", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify([{
        user_id: authUser.id,
        tournament_id: "gfl-s2",
        status: "profile_completed",
        payment_status: "unpaid",
        updated_at: new Date().toISOString()
      }])
    }).catch(() => [])
  ]);

  return NextResponse.json({ profile: (updated as any[])[0] ?? profilePayload });
}
