import { NextRequest, NextResponse } from "next/server";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { COMMISSIONER_COOKIE, CommissionerRole, validateCommissionerPasscode } from "@/lib/auth/commissioner";

export async function GET(req: NextRequest) {
  const role = req.cookies.get(COMMISSIONER_COOKIE)?.value;
  const enabled = role === "owner" || role === "staff";
  return NextResponse.json({ enabled, role: enabled ? role : null });
}

export async function POST(req: NextRequest) {
  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const passcode = asNonEmptyString(body.passcode);
  const role = (asNonEmptyString(body.role) ?? "staff") as CommissionerRole;
  if (!passcode) return badRequest("passcode is required");
  if (!role || !["owner", "staff"].includes(role)) return badRequest("role must be owner or staff");
  if (!validateCommissionerPasscode(role, passcode)) {
    return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, enabled: true, role });
  res.cookies.set(COMMISSIONER_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true, enabled: false });
  res.cookies.set(COMMISSIONER_COOKIE, "", { path: "/", expires: new Date(0) });
  return res;
}
