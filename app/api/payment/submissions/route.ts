import { NextRequest, NextResponse } from "next/server";
import { requireCommissionerRequest } from "@/lib/auth/commissioner";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";
import { getPaymentSubmissions } from "@/lib/server/state";

export async function GET(req: NextRequest) {
  const blocked = requireCommissionerRequest(req, "staff");
  if (blocked) return blocked;

  const search = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";

  if (!isSupabaseConfigured()) return NextResponse.json({ submissions: getPaymentSubmissions(search) });

  const rows = await supabaseAdminTable<any[]>("payment_submissions?select=user_id,status,utr,payer_name,screenshot_name,submitted_at,updated_at");
  const users = await supabaseAdminTable<any[]>("users?select=id,username,email").catch(() => []);
  const profiles = await supabaseAdminTable<any[]>("player_profiles?select=user_id,bgmi_name,bgmi_id,region").catch(() => []);

  const withUser = rows.map((r) => {
    const u = users.find((x) => x.id === r.user_id);
    const p = profiles.find((x) => x.user_id === r.user_id);
    return {
      ...r,
      username: u?.username ?? "Unknown",
      email: u?.email ?? "",
      bgmi_name: p?.bgmi_name,
      bgmi_id: p?.bgmi_id,
      region: p?.region,
      history: []
    };
  });

  const filtered = search
    ? withUser.filter((r) => `${r.username} ${r.payer_name ?? ""} ${r.utr ?? ""}`.toLowerCase().includes(search))
    : withUser;

  return NextResponse.json({ submissions: filtered.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || "")) });
}
