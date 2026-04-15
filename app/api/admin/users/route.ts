import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/permissions";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";

export async function GET() {
  const authz = await requireAdminUser();
  if (!authz.ok) return NextResponse.json({ error: authz.reason }, { status: 403 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ users: [] });
  }

  const users = await supabaseAdminTable<any[]>("users?select=id,username,email,email_verified,role,created_at&order=created_at.desc");
  return NextResponse.json({ users });
}
