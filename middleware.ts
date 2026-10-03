import { auth } from "@/auth";
import { NextResponse } from "next/server";

const DEFAULT_SESSION_MS = 24 * 60 * 60 * 1000; // 1 day — used when "remember me" wasn't checked at login

export default auth((req) => {
  const session = req.auth;
  const isLoggedIn = !!session;
  const isExpiredShortSession =
    isLoggedIn && session.remember === false && Date.now() - Number(session.loginAt ?? 0) > DEFAULT_SESSION_MS;

  if (!isLoggedIn || isExpiredShortSession) {
    const signupUrl = new URL("/signup", req.nextUrl.origin);
    // Bring people back to the page they asked for (e.g. a trade invite link).
    if (!req.nextUrl.pathname.startsWith("/api/")) {
      signupUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    }
    return NextResponse.redirect(signupUrl);
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/binders/:path*",
    "/decks/:path*",
    "/profile/:path*",
    "/cards/:path*",
    "/export/:path*",
    "/trades/:path*",
    "/api/trades/:path*",
    "/api/profile/:path*",
    "/api/cards/:path*",
    "/api/upload/:path*",
    "/api/export/:path*",
  ],
};
