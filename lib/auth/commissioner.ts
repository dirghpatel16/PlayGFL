import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const COMMISSIONER_COOKIE = "gfl_commissioner";

export function isCommissionerPasscodeValid(code: string) {
  return Boolean(process.env.COMMISSIONER_PASSCODE) && code === process.env.COMMISSIONER_PASSCODE;
}

export async function isCommissionerModeEnabled() {
  return (await cookies()).get(COMMISSIONER_COOKIE)?.value === "1";
}

export async function requireCommissionerMode() {
  const enabled = await isCommissionerModeEnabled();
  if (!enabled) return { ok: false as const, reason: "Commissioner mode required" };
  return { ok: true as const };
}

export function requireCommissionerRequest(req: NextRequest) {
  const enabled = req.cookies.get(COMMISSIONER_COOKIE)?.value === "1";
  if (!enabled) return NextResponse.json({ error: "Commissioner mode required" }, { status: 403 });
  return null;
}
