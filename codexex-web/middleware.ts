import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isOnApiGenerate = req.nextUrl.pathname.startsWith("/api/generate");

  if ((isOnDashboard || isOnApiGenerate) && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/generate/:path*"],
  runtime: "nodejs",
};
