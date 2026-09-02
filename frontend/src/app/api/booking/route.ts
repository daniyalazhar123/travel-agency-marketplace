import { NextRequest, NextResponse } from "next/server";
import { query, checkDb } from "@/lib/db";
import {
  BookingRequestSchema,
  validateDateOrder,
} from "@/lib/booking-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Simple in-memory rate limit: 5 submissions / 10 min / IP.
// (Per-instance; swap for Upstash/Redis when you scale horizontally.)
// ---------------------------------------------------------------------------
const RATE_LIMIT_MAX = 5;
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

// Opportunistic cleanup so the Map never grows unbounded
setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of rateBucket) {
    if (now > b.resetAt) rateBucket.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS).unref?.();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
};

export async function POST(request: NextRequest) {
  // 1) Rate limit
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rl = rateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: { ...SECURITY_HEADERS, "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  // 2) Parse body (reject oversized payloads)
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 10_000) {
      return NextResponse.json(
        { success: false, error: "Payload too large." },
        { status: 413, headers: SECURITY_HEADERS }
      );
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body." },
      { status: 400, headers: SECURITY_HEADERS }
    );
  }

  // 3) Zod validation
  const parsed = BookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json(
      { success: false, error: "Please fix the highlighted fields.", fieldErrors },
      { status: 422, headers: SECURITY_HEADERS }
    );
  }
  const data = parsed.data;

  // 4) Cross-field date rule
  const dateError = validateDateOrder(data);
  if (dateError) {
    return NextResponse.json(
      { success: false, error: dateError, fieldErrors: { endDate: dateError } },
      { status: 422, headers: SECURITY_HEADERS }
    );
  }

  // 5) DB availability
  if (!(await checkDb())) {
    return NextResponse.json(
      { success: false, error: "Service temporarily unavailable. Please try again shortly." },
      { status: 503, headers: SECURITY_HEADERS }
    );
  }

  // 6) Secure insert — parameterized only, snake_case to match backend/models.py
  try {
    const rows = await query<{ id: string }>`
      INSERT INTO bookings (
        tenant_id, user_id, full_name, email, phone,
        booking_type, status, destination,
        start_date, end_date, travelers, currency, notes
      ) VALUES (
        ${data.tenantId}, NULL, ${data.fullName}, ${data.email}, ${data.phone ?? null},
        ${data.bookingType}, 'pending', ${data.destination ?? null},
        ${data.startDate ?? null}, ${data.endDate ?? null}, ${data.travelers}, 'USD', ${data.notes ?? null}
      )
      RETURNING id
    `;

    const id = rows[0]?.id;
    if (!id || !UUID_RE.test(id)) {
      throw new Error("Insert returned no valid id");
    }

    return NextResponse.json(
      {
        success: true,
        bookingId: id,
        message: "Request received — a travel designer will contact you within 24 hours.",
      },
      { status: 201, headers: SECURITY_HEADERS }
    );
  } catch (err) {
    // Log full error server-side; return generic message client-side
    console.error("[booking] insert failed:", err);
    return NextResponse.json(
      { success: false, error: "We couldn't save your request. Please try again." },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}

// Reject non-POST verbs explicitly
export async function GET() {
  return NextResponse.json(
    { success: false, error: "Method not allowed." },
    { status: 405, headers: { ...SECURITY_HEADERS, Allow: "POST" } }
  );
}
