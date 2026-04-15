import { cookies } from "next/headers";
import { supabaseUser } from "@/lib/supabase/rest";

export const ACCESS_COOKIE = "gfl_access_token";
export const REFRESH_COOKIE = "gfl_refresh_token";

export function readAccessToken() {
  return cookies().get(ACCESS_COOKIE)?.value;
}

export async function getSessionUser() {
  const token = readAccessToken();
  if (!token) return null;
  try {
    return await supabaseUser(token);
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
