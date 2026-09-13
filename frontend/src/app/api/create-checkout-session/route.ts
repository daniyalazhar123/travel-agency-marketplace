import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Secure proxy: browser -> this route -> FastAPI backend -> Stripe.
//
// WHY THIS EXISTS
// - Keeps the call to the backend on the server side so no secret is ever
//   client-exposed and the backend's real shape/URLs never leak to the browser.
// - Normalizes backend errors into the app's { success, error } shape.
// - Forwards the caller's Authorization header (JWT) when present, so logged-in
//   users get bookings linked to their account while guests can still pay.
//   The backend's `get_optional_user` treats missing/invalid tokens as guests.
// ---------------------------------------------------------------------------

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://127.0.0.1:8000";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
};

// Mirror of the backend CheckoutRequest model — reject junk early,
// server still re-validates everything.
const TENANT_RE = /^[a-z0-9-]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const MAX_BODY_BYTES = 2_000; // tiny payload; anything bigger is abuse

interface CheckoutSessionPayload {
  tenant_id: string;
  destination_id: string;
  email: string;
  travelers: number;
  start_date: string | null;
  notes: string | null;
}

function parseBody(raw: unknown): { ok: true; data: CheckoutSessionPayload } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "Invalid request body." };
  }
  const b = raw as Record<string, unknown>;

  const tenantId = typeof b.tenantId === "string" ? b.tenantId.trim() : "";
  if (!TENANT_RE.test(tenantId)) {
    return { ok: false, error: "Invalid tenant." };
  }

  const destinationId = typeof b.destinationId === "string" ? b.destinationId.trim() : "";
  if (!UUID_RE.test(destinationId)) {
    return { ok: false, error: "Invalid destination." };
  }

  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 320) {
    return { ok: false, error: "A valid email is required for your receipt." };
  }

  let travelers = 1;
  if (b.travelers !== undefined) {
    const n = Number(b.travelers);
    if (!Number.isInteger(n) || n < 1 || n > 20) {
      return { ok: false, error: "Travelers must be between 1 and 20." };
    }
    travelers = n;
  }

  let startDate: string | null = null;
  if (typeof b.startDate === "string" && b.startDate !== "") {
    if (!DATE_RE.test(b.startDate)) {
      return { ok: false, error: "Travel date must be YYYY-MM-DD." };
    }
    startDate = b.startDate;
  }

  let notes: string | null = null;
  if (typeof b.notes === "string" && b.notes.trim() !== "") {
    if (b.notes.length > 2000) {
      return { ok: false, error: "Notes are limited to 2000 characters." };
    }
    notes = b.notes.trim();
  }

  return {
    ok: true,
    data: { tenant_id: tenantId, destination_id: destinationId, email, travelers, start_date: startDate, notes },
  };
}

// ---------------------------------------------------------------------------
// Simple in-memory rate limit: 10 checkout attempts / 10 min / IP.
// (Per-instance; swap for Upstash/Redis when scaling horizontally.)
// ---------------------------------------------------------------------------
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const rateBucket = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = rateBucket.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBucket.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (bucket.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of rateBucket) {
    if (now > b.resetAt) rateBucket.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS).unref?.();

export async function POST(request: NextRequest) {
  // 1) Rate limit
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rl = rateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many checkout attempts. Please try again later." },
      { status: 429, headers: { ...SECURITY_HEADERS, "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  // 2) Parse + size-check body
  let rawBody: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: "Payload too large." },
        { status: 413, headers: SECURITY_HEADERS }
      );
    }
    rawBody = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body." },
      { status: 400, headers: SECURITY_HEADERS }
    );
  }

  // 3) Validate shape (backend re-validates authoritatively)
  const parsed = parseBody(rawBody);
  if (!parsed.ok) {
    return NextResponse.json(
      { success: false, error: parsed.error },
      { status: 422, headers: SECURITY_HEADERS }
    );
  }

  // 4) Forward to backend, passing through the caller's Authorization header
  //    when present (optional auth — guests can still check out)
  const authHeader = request.headers.get("authorization");
  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/payments/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Payment service unreachable — please try again shortly." },
      { status: 502, headers: SECURITY_HEADERS }
    );
  }

  // 5) Normalize backend response into the app's { success, url } shape
  let json: unknown;
  try {
    json = await backendRes.json();
  } catch {
    json = null;
  }

  if (backendRes.ok) {
    const url = (json as { url?: string } | null)?.url;
    if (typeof url === "string" && url.startsWith("https://")) {
      return NextResponse.json(
        {
          success: true,
          url,
          sessionId: (json as { session_id?: string }).session_id ?? null,
        },
        { status: 200, headers: SECURITY_HEADERS }
      );
    }
    console.error("[checkout-proxy] backend 2xx without usable url:", json);
    return NextResponse.json(
      { success: false, error: "Checkout session could not be created." },
      { status: 502, headers: SECURITY_HEADERS }
    );
  }

  // Non-2xx from backend: surface a safe, actionable message.
  const detail = (json as { detail?: unknown } | null)?.detail;
  const safeError =
    typeof detail === "string"
      ? detail
      : (detail as { detail?: string } | undefined)?.detail ??
        "Could not start checkout — please try again.";
  const status =
    backendRes.status === 404
      ? 404
      : backendRes.status === 422
        ? 422
        : backendRes.status === 503
          ? 503
          : 502;

  return NextResponse.json(
    { success: false, error: safeError },
    { status, headers: SECURITY_HEADERS }
  );
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: "Method not allowed." },
    { status: 405, headers: { ...SECURITY_HEADERS, Allow: "POST" } }
  );
}
