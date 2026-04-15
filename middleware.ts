import { NextRequest, NextResponse } from "next/server";
import { isLaunchUnlocked } from "@/lib/config/launch";
import { ACCESS_COOKIE } from "@/lib/auth/session";

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/images") ||
    pathname.includes(".")
  );
}

function requiresAuth(pathname: string) {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/auction");
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (isStaticAsset(pathname)) return NextResponse.next();

  const bypassEnabled = process.env.LAUNCH_GATE_BYPASS === "true";
  const unlocked = bypassEnabled || isLaunchUnlocked();

  if (!unlocked && pathname !== "/launch") {
    const url = req.nextUrl.clone();
    url.pathname = "/launch";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (unlocked && pathname === "/launch") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (requiresAuth(pathname) && !req.cookies.get(ACCESS_COOKIE)?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  const headers = new Headers(req.headers);
  headers.set("x-gfl-pathname", pathname);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
