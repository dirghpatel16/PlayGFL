import { NextRequest, NextResponse } from "next/server";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { COMMISSIONER_COOKIE, isCommissionerPasscodeValid } from "@/lib/auth/commissioner";

export async function GET(req: NextRequest) {
  const enabled = req.cookies.get(COMMISSIONER_COOKIE)?.value === "1";
  return NextResponse.json({ enabled });
}

export async function POST(req: NextRequest) {
  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const passcode = asNonEmptyString(body.passcode);
  if (!passcode) return badRequest("passcode is required");
  if (!isCommissionerPasscodeValid(passcode)) {
    return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, enabled: true });
  res.cookies.set(COMMISSIONER_COOKIE, "1", {
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
