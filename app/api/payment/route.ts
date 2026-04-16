import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { getPayment, setPayment, verifyPayment } from "@/lib/server/state";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";
import { requireCommissionerRequest } from "@/lib/auth/commissioner";

export async function GET() {
  const authUser = await getSessionUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ payment: getPayment(authUser.id) });
  }

  const rows = await supabaseAdminTable<any[]>(`payment_submissions?user_id=eq.${authUser.id}&select=*`);
  return NextResponse.json({ payment: rows[0] ?? { status: "unpaid" } });
}

export async function POST(req: NextRequest) {
  const authUser = await getSessionUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const utr = asNonEmptyString(body.utr);
  const payerName = asNonEmptyString(body.payerName);
  const screenshotName = asNonEmptyString(body.screenshotName) ?? undefined;
  if (!utr || !payerName) return badRequest("utr and payerName are required");

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ payment: setPayment(authUser.id, { utr, payerName, screenshotName }) });
  }

  const payload = { user_id: authUser.id, status: "submitted", utr, payer_name: payerName, screenshot_name: screenshotName };
  const rows = await supabaseAdminTable<any[]>("payment_submissions", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify([payload])
  });
  return NextResponse.json({ payment: rows[0] ?? payload }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const blocked = requireCommissionerRequest(req);
  if (blocked) return blocked;

  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");
  const userId = asNonEmptyString(body.userId);
  if (!userId) return badRequest("userId is required");

  if (!isSupabaseConfigured()) return NextResponse.json({ payment: verifyPayment(userId) });

  const rows = await supabaseAdminTable<any[]>(`payment_submissions?user_id=eq.${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "verified" })
  });

  return NextResponse.json({ payment: rows[0] ?? { user_id: userId, status: "verified" } });
}
