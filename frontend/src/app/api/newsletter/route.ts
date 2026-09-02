import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query, checkDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Rate limit: 5 submissions / 10 min / IP (in-memory; per-instance)
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

setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of rateBucket) {
    if (now > b.resetAt) rateBucket.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS).unref?.();

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
};

const NewsletterSchema = z.object({
  email: z.email("Please enter a valid email address.").max(320).toLowerCase(),
  tenantId: z
    .string()
    .trim()
    .min(1, "Tenant is required.")
    .max(64)
    .regex(/^[a-z0-9-]+$/i, "Invalid tenant id.")
    .default("demo"),
  source: z.enum(["newsletter", "contact_form", "hero_cta"]).default("newsletter"),
});

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

  // 2) Parse + validate body
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 2_000) {
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

  const parsed = NewsletterSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "email";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json(
      { success: false, error: "Please enter a valid email address.", fieldErrors },
      { status: 400, headers: SECURITY_HEADERS }
    );
  }
  const { email, tenantId, source } = parsed.data;

  // 3) DB availability
  if (!(await checkDb())) {
    return NextResponse.json(
      { success: false, error: "Service temporarily unavailable. Please try again shortly." },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }

  // 4) Insert — graceful duplicate handling via ON CONFLICT
  try {
    // (tenant_id, email) unique constraint if present; otherwise check-then-insert.
    // The leads table as created has no unique constraint, so we do an atomic
    // upsert-style guard: check existing active subscription first.
    const existing = await query<{ id: string; is_active: boolean }>`
      SELECT id, is_active FROM leads
      WHERE tenant_id = ${tenantId} AND email = ${email} AND source = 'newsletter'
      LIMIT 1
    `;

    if (existing.length > 0 && existing[0].is_active) {
      // Already subscribed — treat as success (idempotent, no crash)
      return NextResponse.json(
        { success: true, message: "You're already on the list — welcome back!", already: true },
        { status: 200, headers: SECURITY_HEADERS }
      );
    }

    if (existing.length > 0 && !existing[0].is_active) {
      // Previously unsubscribed — reactivate
      await query`
        UPDATE leads SET is_active = true, unsubscribed_at = NULL,
               source = ${source}, updated_at = now()
        WHERE id = ${existing[0].id}
      `;
      return NextResponse.json(
        { success: true, message: "Welcome back — you're subscribed again!", already: false },
        { status: 200, headers: SECURITY_HEADERS }
      );
    }

    // New subscriber
    await query`
      INSERT INTO leads (tenant_id, email, source, is_active)
      VALUES (${tenantId}, ${email}, ${source}, true)
    `;

    return NextResponse.json(
      { success: true, message: "Thank you for subscribing! Travel inspiration is on its way." },
      { status: 200, headers: SECURITY_HEADERS }
    );
  } catch (err) {
    // Defensive: if a unique constraint exists (added later) and we raced, treat as OK
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("duplicate key") || msg.includes("unique")) {
      return NextResponse.json(
        { success: true, message: "You're already on the list — welcome back!", already: true },
        { status: 200, headers: SECURITY_HEADERS }
      );
    }
    console.error("[newsletter] insert failed:", err);
    return NextResponse.json(
      { success: false, error: "We couldn't save your subscription. Please try again." },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: "Method not allowed." },
    { status: 405, headers: { ...SECURITY_HEADERS, Allow: "POST" } }
  );
}
