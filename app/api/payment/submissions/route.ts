import { NextRequest, NextResponse } from "next/server";
import { requireCommissionerRequest } from "@/lib/auth/commissioner";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";

export async function GET(req: NextRequest) {
  const blocked = requireCommissionerRequest(req, "staff");
  if (blocked) return blocked;

  const search = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";

  if (!isSupabaseConfigured()) return NextResponse.json({ submissions: [] });

  const rows = await supabaseAdminTable<any[]>("payment_submissions?select=user_id,status,utr,payer_name,screenshot_name,updated_at");
  const users = await supabaseAdminTable<any[]>("users?select=id,username,email").catch(() => []);

  const withUser = rows.map((r) => {
    const u = users.find((x) => x.id === r.user_id);
    return { ...r, username: u?.username ?? "Unknown", email: u?.email ?? "" };
  });

  const filtered = search
    ? withUser.filter((r) => `${r.username} ${r.payer_name ?? ""} ${r.utr ?? ""}`.toLowerCase().includes(search))
    : withUser;

  return NextResponse.json({ submissions: filtered });
}
