import { NextRequest, NextResponse } from "next/server";
import { asNonEmptyString, badRequest, parseJSON } from "@/lib/server/auth";
import { loginUser } from "@/lib/server/state";

export async function POST(req: NextRequest) {
  const body = await parseJSON(req);
  if (!body) return badRequest("Invalid JSON body");

  const email = asNonEmptyString(body.email);
  const password = asNonEmptyString(body.password);

  if (!email || !password) {
    return badRequest("email and password are required");
  }

  const result = loginUser(email, password);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json(result.user);
}
