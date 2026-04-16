import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const COMMISSIONER_COOKIE = "gfl_commissioner";
export type CommissionerRole = "owner" | "staff";

function getOwnerPasscode() {
  return process.env.OWNER_COMMISSIONER_CODE || process.env.OWNER_PASSCODE || process.env.COMMISSIONER_PASSCODE || "";
}

function getStaffPasscode() {
  return process.env.STAFF_COMMISSIONER_CODE || process.env.STAFF_PASSCODE || "";
}

export function validateCommissionerPasscode(role: CommissionerRole, code: string) {
  if (role === "owner") return Boolean(getOwnerPasscode()) && code === getOwnerPasscode();
  return Boolean(getStaffPasscode()) && code === getStaffPasscode();
}

export async function getCommissionerRole(): Promise<CommissionerRole | null> {
  const value = (await cookies()).get(COMMISSIONER_COOKIE)?.value;
  return value === "owner" || value === "staff" ? value : null;
}

export async function requireCommissionerMode(minRole: CommissionerRole = "staff") {
  const role = await getCommissionerRole();
  if (!role) return { ok: false as const, reason: "Commissioner mode required" };
  if (minRole === "owner" && role !== "owner") return { ok: false as const, reason: "Owner mode required" };
  return { ok: true as const, role };
}

export function requireCommissionerRequest(req: NextRequest, minRole: CommissionerRole = "staff") {
  const role = req.cookies.get(COMMISSIONER_COOKIE)?.value;
  if (role !== "owner" && role !== "staff") return NextResponse.json({ error: "Commissioner mode required" }, { status: 403 });
  if (minRole === "owner" && role !== "owner") return NextResponse.json({ error: "Owner mode required" }, { status: 403 });
  return null;
}
