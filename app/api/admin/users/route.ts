import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";
import { requireCommissionerRequest } from "@/lib/auth/commissioner";

export async function GET(req: NextRequest) {
  const blocked = requireCommissionerRequest(req);
  if (blocked) return blocked;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ users: [] });
  }

  const users = await supabaseAdminTable<any[]>("users?select=id,username,email,email_verified,role,created_at&order=created_at.desc");
  return NextResponse.json({ users });
}
