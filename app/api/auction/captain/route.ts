import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";

/** Returns the captain record linked to the currently signed-in user, or null. */
export async function GET() {
  const authUser = await getSessionUser();
  if (!authUser) return NextResponse.json({ captain: null });

  if (!isSupabaseConfigured()) return NextResponse.json({ captain: null });

  const rows = await supabaseAdminTable<any[]>(`captains?user_id=eq.${authUser.id}&select=id,name,tag,purse_points`).catch(() => []);
  return NextResponse.json({ captain: rows[0] ?? null });
}
