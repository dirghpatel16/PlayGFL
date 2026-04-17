import { auth, currentUser } from "@clerk/nextjs/server";

export interface SessionUser {
  id: string;
  email?: string;
  username?: string;
  emailVerified: boolean;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  // currentUser() fetches the full Clerk user object (cached per-request)
  const user = await currentUser();
  if (!user) return null;

  return {
    id: userId,
    email: user.emailAddresses[0]?.emailAddress,
    username: user.username ?? undefined,
    emailVerified: true // Clerk users are always verified when signed in
  };
}

// Kept for legacy cookie reads (no-op in Clerk mode)
export const ACCESS_COOKIE = "gfl_access_token";
export const REFRESH_COOKIE = "gfl_refresh_token";
export function readAccessToken() { return undefined; }
export function authCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds
  };
}
