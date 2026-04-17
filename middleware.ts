import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isLaunchUnlocked } from "@/lib/config/launch";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  // Launch gate — skip for static/API/Clerk routes
  const isInternal =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".");

  if (!isInternal) {
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
  }

  // Protect dashboard + admin — Clerk redirects to /sign-in automatically
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)"
  ]
};
