import { NextRequest, NextResponse } from "next/server";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { hasUser } from "@/lib/server/state";

export async function POST(req: NextRequest) {
  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const email = asNonEmptyString(body.email);
  if (!email) {
    return badRequest("email is required");
  }

  return NextResponse.json({
    ok: true,
    message: hasUser(email)
      ? "Password reset request accepted. Check your inbox."
      : "If this email exists, a reset message has been sent."
  });
}
