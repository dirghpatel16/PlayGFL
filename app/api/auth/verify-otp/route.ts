import { NextRequest, NextResponse } from "next/server";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { supabaseAuthRequest, supabaseUser } from "@/lib/supabase/rest";
import { ACCESS_COOKIE, REFRESH_COOKIE, authCookieOptions } from "@/lib/auth/session";

interface VerifyRes {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export async function POST(req: NextRequest) {
  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const email = asNonEmptyString(body.email);
  const otp = asNonEmptyString(body.otp);
  if (!email || !otp) return badRequest("email and otp are required");

  const session = await supabaseAuthRequest<VerifyRes>("/auth/v1/verify", {
    method: "POST",
    body: JSON.stringify({ type: "signup", email, token: otp })
  });

  const user = await supabaseUser(session.access_token);
  const response = NextResponse.json({ ok: true, emailVerified: Boolean(user.email_confirmed_at) });
  response.cookies.set(ACCESS_COOKIE, session.access_token, authCookieOptions(session.expires_in));
  response.cookies.set(REFRESH_COOKIE, session.refresh_token, authCookieOptions(60 * 60 * 24 * 30));
  return response;
}
