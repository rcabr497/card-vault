import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  if (!isLoggedIn) {
    const signupUrl = new URL("/signup", req.nextUrl.origin);
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
    "/api/cards/:path*",
    "/api/upload/:path*",
  ],
};
