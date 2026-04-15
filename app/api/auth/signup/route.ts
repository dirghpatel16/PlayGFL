import { NextRequest, NextResponse } from "next/server";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { signupUser } from "@/lib/server/state";

export async function POST(req: NextRequest) {
  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const username = asNonEmptyString(body.username);
  const email = asNonEmptyString(body.email);
  const password = asNonEmptyString(body.password);

  if (!username || !email || !password) {
    return badRequest("username, email and password are required");
  }

  const result = signupUser(username, email, password);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json(result.user, { status: 201 });
}
