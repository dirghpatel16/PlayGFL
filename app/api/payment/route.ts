import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { getPayment, isUtrUsed, setPayment, setPaymentStatus, verifyPayment } from "@/lib/server/state";
import { isSupabaseConfigured, supabaseAdminTable } from "@/lib/supabase/rest";
import { requireCommissionerRequest } from "@/lib/auth/commissioner";

const label = (status: string) => status === "confirmed" ? "Payment Confirmed" : status === "submitted" ? "Payment Submitted" : status === "rejected" ? "Rejected" : "Unpaid";

export async function GET() {
  const authUser = await getSessionUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSupabaseConfigured()) {
    const payment = getPayment(authUser.id);
    return NextResponse.json({ payment: { ...payment, label: label(payment.status) } });
  }

  const rows = await supabaseAdminTable<any[]>(`payment_submissions?user_id=eq.${authUser.id}&select=*`);
  const payment = rows[0] ?? { status: "unpaid" };
  return NextResponse.json({ payment: { ...payment, label: label(payment.status) } });
}

export async function POST(req: NextRequest) {
  const authUser = await getSessionUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const utr = asNonEmptyString(body.utr);
  const payerName = asNonEmptyString(body.payerName);
  const screenshotName = asNonEmptyString(body.screenshotName);
  if (!utr || !payerName || !screenshotName) return badRequest("payerName, utr, and screenshotName are required");

  if (!isSupabaseConfigured() && isUtrUsed(utr, authUser.id)) {
    return NextResponse.json({ error: "UTR already used" }, { status: 409 });
  }

  if (isSupabaseConfigured()) {
    const duplicate = await supabaseAdminTable<any[]>(`payment_submissions?utr=eq.${encodeURIComponent(utr)}&select=user_id`).catch(() => []);
    if (duplicate.some((d) => d.user_id !== authUser.id)) {
      return NextResponse.json({ error: "UTR already used" }, { status: 409 });
    }
  }

  if (!isSupabaseConfigured()) {
    const payment = setPayment(authUser.id, { utr, payerName, screenshotName });
    return NextResponse.json({ payment: { ...payment, label: label(payment.status) }, message: "Payment submitted for verification" });
  }

  const payload = { user_id: authUser.id, status: "submitted", utr, payer_name: payerName, screenshot_name: screenshotName, submitted_at: new Date().toISOString() };
  const rows = await supabaseAdminTable<any[]>("payment_submissions", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify([payload])
  });
  const payment = rows[0] ?? payload;
  return NextResponse.json({ payment: { ...payment, label: label(payment.status) }, message: "Payment submitted for verification" }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const blocked = requireCommissionerRequest(req, "staff");
  if (blocked) return blocked;

  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");
  const userId = asNonEmptyString(body.userId);
  const action = asNonEmptyString(body.action) ?? "confirm";
  if (!userId) return badRequest("userId is required");
  if (!["confirm", "reject"].includes(action)) return badRequest("action must be confirm or reject");

  const nextStatus = action === "reject" ? "rejected" : "confirmed";

  if (!isSupabaseConfigured()) {
    const payment = action === "reject" ? setPaymentStatus(userId, "rejected") : verifyPayment(userId);
    return NextResponse.json({ payment: { ...payment, label: label(payment.status) } });
  }

  const patch = nextStatus === "rejected" ? { status: "rejected" } : { status: "confirmed" };
  const rows = await supabaseAdminTable<any[]>(`payment_submissions?user_id=eq.${userId}`, { method: "PATCH", body: JSON.stringify(patch) });
  const payment = rows[0] ?? { user_id: userId, status: nextStatus };
  return NextResponse.json({ payment: { ...payment, label: label(payment.status) } });
}
