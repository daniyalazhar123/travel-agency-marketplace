import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query, checkDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Contact intake -> leads table (source=contact_form). Mirrors /api/newsletter.
// NOTE: the leads schema has no columns for name/phone/message — those fields
// are validated here but not persisted. Full persistence requires a schema
// migration (Phase 2 follow-up).
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

const ContactSchema = z.object({
  tenantId: z.string().trim().min(1, "Tenant is required.").max(64).regex(/^[a-z0-9-]+$/i, "Invalid tenant id."),
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  email: z.email("A valid email is required.").max(320).toLowerCase(),
  phone: z.string().trim().max(32).regex(/^[+0-9()\-\s]*$/, "Invalid phone number.").optional().or(z.literal("").transform(() => undefined)),
  subject: z.string().trim().max(100).optional(),
  destination: z.string().trim().max(200).optional(),
  travelDates: z.string().trim().max(100).optional(),
  travelers: z.string().trim().max(10).optional(),
  budget: z.string().trim().max(50).optional(),
  message: z.string().trim().min(1, "Message is required.").max(5000),
  newsletter: z.boolean().default(false),
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

  // 2) Parse + size check
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 10_000) {
      return NextResponse.json({ success: false, error: "Payload too large." }, { status: 413, headers: SECURITY_HEADERS });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400, headers: SECURITY_HEADERS });
  }

  // 3) Zod validation
  const parsed = ContactSchema.safeParse(body);
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
  const { tenantId, email } = parsed.data;

  // 4) DB availability
  if (!(await checkDb())) {
    return NextResponse.json({ success: false, error: "Service temporarily unavailable. Please try again shortly." }, { status: 503, headers: SECURITY_HEADERS });
  }

  // 5) Idempotent lead capture (source=contact_form)
  try {
    const existing = await query<{ id: string; is_active: boolean }>`
      SELECT id, is_active FROM leads
      WHERE tenant_id = ${tenantId} AND email = ${email} AND source = 'contact_form'
      LIMIT 1
    `;

    if (existing.length > 0 && existing[0].is_active) {
      return NextResponse.json(
        { success: true, message: "Thank you — your inquiry was received. A travel designer will reply within 24 hours." },
        { status: 200, headers: SECURITY_HEADERS }
      );
    }

    if (existing.length > 0 && !existing[0].is_active) {
      await query`
        UPDATE leads SET is_active = true, unsubscribed_at = NULL, updated_at = now()
        WHERE id = ${existing[0].id}
      `;
      return NextResponse.json(
        { success: true, message: "Thank you — your inquiry was received. A travel designer will reply within 24 hours." },
        { status: 200, headers: SECURITY_HEADERS }
      );
    }

    await query`
      INSERT INTO leads (tenant_id, email, source, is_active)
      VALUES (${tenantId}, ${email}, 'contact_form', true)
    `;

    return NextResponse.json(
      { success: true, message: "Thank you — your inquiry was received. A travel designer will reply within 24 hours." },
      { status: 201, headers: SECURITY_HEADERS }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("duplicate key") || msg.includes("unique")) {
      return NextResponse.json(
        { success: true, message: "Thank you — your inquiry was received. A travel designer will reply within 24 hours." },
        { status: 200, headers: SECURITY_HEADERS }
      );
    }
    console.error("[contact] insert failed:", err);
    return NextResponse.json({ success: false, error: "We couldn't send your message. Please try again." }, { status: 500, headers: SECURITY_HEADERS });
  }
}

export async function GET() {
  return NextResponse.json({ success: false, error: "Method not allowed." }, { status: 405, headers: { ...SECURITY_HEADERS, Allow: "POST" } });
}
