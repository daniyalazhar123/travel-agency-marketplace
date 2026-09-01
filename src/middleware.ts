import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEFAULT_TENANT = "demo";

const TENANT_SCOPED_ROUTES = [
  "/explore",
  "/destinations",
  "/experiences",
  "/booking",
  "/about",
  "/contact",
  "/journal",
  "/dashboard",
  "/newsletter",
  "/privacy",
  "/terms",
  "/cookies",
  "/accessibility",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip if already tenant-scoped (starts with /demo/ or /default/ or any known tenant)
  // or is a static asset / API / internal Next.js path
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/og-image") ||
    pathname.startsWith("/site.webmanifest") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Check if path matches a tenant-scoped route WITHOUT a tenant prefix
  const isTenantScopedRoute = TENANT_SCOPED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isTenantScopedRoute) {
    // Redirect /explore -> /demo/explore
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_TENANT}${pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and internals
    "/((?!_next/static|_next/image|favicon.ico|og-image.jpg|site.webmanifest).*)",
  ],
};
