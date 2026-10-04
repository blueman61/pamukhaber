import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/giris") return NextResponse.next();

  const ok = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/admin/giris", request.url));
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
