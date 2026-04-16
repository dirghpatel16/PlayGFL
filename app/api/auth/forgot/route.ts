import { NextRequest, NextResponse } from "next/server";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { supabaseAuthRequest } from "@/lib/supabase/rest";

export async function POST(req: NextRequest) {
  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const email = asNonEmptyString(body.email);
  if (!email) return badRequest("email is required");

  await supabaseAuthRequest("/auth/v1/recover", {
    method: "POST",
    body: JSON.stringify({ email })
  });

  return NextResponse.json({ ok: true, message: "Password reset email sent. Check your inbox." });
}
