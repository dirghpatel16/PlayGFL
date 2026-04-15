import { getSessionUser } from "@/lib/auth/session";
import { supabaseAdminTable } from "@/lib/supabase/rest";

export async function requireAdminUser() {
  const authUser = await getSessionUser();
  if (!authUser) return { ok: false as const, reason: "Unauthorized" };

  const rows = await supabaseAdminTable<{ role: string }[]>(`users?select=role&id=eq.${authUser.id}&limit=1`);
  const role = rows[0]?.role ?? "player";
  if (role !== "admin") return { ok: false as const, reason: "Admin role required" };

  return { ok: true as const, userId: authUser.id };
}
