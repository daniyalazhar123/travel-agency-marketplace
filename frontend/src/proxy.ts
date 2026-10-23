import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Secure proxy wrapper — ensures HttpOnly cookies are sent on all proxied requests.
 * Removes the dangerous auto-redirect to /demo tenant that bypassed authentication.
 */

// Protected routes require auth_token cookie (HttpOnly, Secure, SameSite="lax")
const PROTECTED_PATHS = ["/dashboard", "/admin", "/booking"];
const AUTH_COOKIE = "auth_token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets / API / internal Next.js paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/og-image") ||
    pathname.startsWith("/apple-touch-icon")
  ) {
    return NextResponse.next();
  }

  // Check for auth_token cookie (HttpOnly, Secure, SameSite="lax")
  const authCookie = request.cookies.get(AUTH_COOKIE);
  const hasAuthToken = !!authCookie?.value;

  // Block protected routes if cookie is missing — NO redirect to /demo
  for (const protectedPath of PROTECTED_PATHS) {
    if (pathname === protectedPath || pathname.startsWith(protectedPath + "/")) {
      if (!hasAuthToken) {
        const url = new URL("/login", request.url);
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  // No more auto-redirect to /demo tenant — tenant resolution
  // must come from authenticated session, not URL path manipulation
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|og-image.jpg|site.webmanifest).*)",
  ],
};
