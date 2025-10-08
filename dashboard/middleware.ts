import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const session = request.cookies.get("dashboard_session")
  const isLoginPage = request.nextUrl.pathname === "/login"
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard")

  // Redirect to login if accessing dashboard without session
  if (isDashboardPage && !session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect to dashboard if accessing login with session
  if (isLoginPage && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}
