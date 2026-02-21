import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin-auth";

export default auth((req) => {
  const path = req.nextUrl.pathname;
  if (!path.startsWith("/admin")) {
    return NextResponse.next();
  }

  const session = req.auth;
  if (!session?.user?.id) {
    const loginUrl = new URL("/auth/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  if (!isAdminEmail(session.user.email)) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
