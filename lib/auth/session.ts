import { cookies, headers } from "next/headers";
import { supabaseUser } from "@/lib/supabase/rest";

export const ACCESS_COOKIE = "gfl_access_token";
export const REFRESH_COOKIE = "gfl_refresh_token";

export interface SessionUser {
  id: string;
  email?: string;
  username?: string;
  emailVerified: boolean;
}

export function readAccessToken() {
  return cookies().get(ACCESS_COOKIE)?.value;
}

function readClerkUserFromHeaders(): SessionUser | null {
  const h = headers();
  const id = h.get("x-clerk-user-id") || h.get("x-user-id");
  if (!id) return null;
  const email = h.get("x-clerk-user-email") || undefined;
  const username = h.get("x-clerk-username") || undefined;
  const verified = (h.get("x-clerk-email-verified") || "true").toLowerCase() === "true";
  return { id, email, username, emailVerified: verified };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const clerkUser = readClerkUserFromHeaders();
  if (clerkUser) return clerkUser;

  const token = readAccessToken();
  if (!token) return null;
  try {
    const legacy = await supabaseUser(token);
    return {
      id: legacy.id,
      email: legacy.email,
      username: typeof legacy.user_metadata?.username === "string" ? legacy.user_metadata.username : undefined,
      emailVerified: Boolean(legacy.email_confirmed_at)
    };
  } catch {
    return null;
  }
}

export function authCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds
  };
}
