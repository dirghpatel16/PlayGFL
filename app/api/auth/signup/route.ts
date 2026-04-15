import { NextRequest, NextResponse } from "next/server";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { supabaseAuthRequest, supabaseAdminTable } from "@/lib/supabase/rest";

interface SignupRes {
  user?: { id: string; email?: string };
}

export async function POST(req: NextRequest) {
  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const username = asNonEmptyString(body.username);
  const email = asNonEmptyString(body.email);
  const password = asNonEmptyString(body.password);

  if (!username || !email || !password) return badRequest("username, email and password are required");

  const result = await supabaseAuthRequest<SignupRes>("/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      data: { username, role: "player" }
    })
  });

  if (result.user?.id) {
    await supabaseAdminTable("users", {
      method: "POST",
      body: JSON.stringify([
        {
          id: result.user.id,
          username,
          email,
          email_verified: false,
          role: "player"
        }
      ])
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, message: "Signup created. Verify email before league actions." }, { status: 201 });
}
