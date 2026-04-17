import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";

export async function GET() {
  const authUser = await getSessionUser();
  if (!authUser) return NextResponse.json({ user: null });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ user: { id: authUser.id, email: authUser.email, role: "player", emailVerified: authUser.emailVerified } });
  }

  const rows = await supabaseAdminTable<any[]>(`player_profiles?user_id=eq.${authUser.id}&select=username&limit=1`);
  const row = rows[0];
  return NextResponse.json({ user: { id: authUser.id, email: authUser.email, username: row?.username, role: "player", emailVerified: authUser.emailVerified } });
}
