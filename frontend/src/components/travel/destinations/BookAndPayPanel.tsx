"use client";

/**
 * Book & Pay Instantly panel — the primary CTA on destination detail pages.
 *
 * Posts to our own /api/create-checkout-session proxy (which calls FastAPI,
 * which creates the Stripe Checkout Session with the amount re-computed
 * server-side from the DB — never from this client). On success, redirects
 * the browser to Stripe's hosted payment page.
 *
 * Included states: travelers selector, travel date (optional), live total,
 * submitting (redirecting), and inline error feedback. No motion libraries —
 * functional Phase 1 UI.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CreditCard, Loader2, AlertCircle, ShieldCheck, Users, Calendar, Minus, Plus } from "lucide-react";
import { getToken } from "@/lib/session";

interface BookAndPayPanelProps {
  tenant: string;
  destinationId: string;
  destinationName: string;
  price: number; // per person, server re-validates anyway
  currency: string;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function BookAndPayPanel({
  tenant,
  destinationId,
  destinationName,
  price,
  currency,
}: BookAndPayPanelProps) {
  const [email, setEmail] = useState("");
  const [travelers, setTravelers] = useState("1");
  const [travelDate, setTravelDate] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = price * Number(travelers);

  const formatMoney = (amount: number, cur = currency) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: cur,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${cur} ${amount.toLocaleString()}`;
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPaying) return;
    setError(null);

    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email for your receipt.");
      return;
    }
    if (travelDate && !DATE_RE.test(travelDate)) {
      setError("Please pick a valid travel date.");
      return;
    }

    setIsPaying(true);
    try {
      // Forward session JWT when present so the booking links to the account
      const token = getToken();
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tenantId: tenant,
          destinationId,
          email: email.trim(),
          travelers: Number(travelers),
          startDate: travelDate,
          notes: `Instant booking: ${destinationName}`,
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; url?: string; error?: string }
        | null;

      if (res.ok && json?.success && json.url) {
        window.location.href = json.url; // -> Stripe hosted checkout
        return;
      }
      setError(json?.error ?? "Could not start checkout — please try again.");
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="glass-card p-8 elegant-shadow">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <span className="text-sm font-medium text-muted-foreground">From</span>
        <span className="font-display text-3xl font-medium text-accent">
          {formatMoney(price)}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-6">per person</p>

      <form onSubmit={handleCheckout} className="space-y-4" noValidate>
        <div className="space-y-2">
          <label htmlFor="pay-email" className="text-sm font-medium text-foreground">
            Email <span className="text-error">*</span>
          </label>
          <input
            id="pay-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            maxLength={320}
            required
            disabled={isPaying}
            className="flex h-11 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring disabled:opacity-50"
            aria-invalid={error?.includes("email") ? true : undefined}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label id="pay-travelers-label" className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              Travelers
            </label>
            <div
              className="flex h-11 items-center justify-between rounded-lg border border-border bg-background px-2"
              role="group"
              aria-labelledby="pay-travelers-label"
            >
              <button
                type="button"
                onClick={() => setTravelers((t) => String(Math.max(1, Number(t) - 1)))}
                disabled={isPaying || travelers === "1"}
                className="flex h-8 w-8 items-center justify-center rounded-md text-foreground transition-all hover:bg-muted active:scale-90 disabled:opacity-40 disabled:hover:bg-transparent"
                aria-label="Remove one traveler"
              >
                <Minus className="w-4 h-4" aria-hidden="true" />
              </button>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={travelers}
                  className="min-w-8 text-center text-sm font-medium text-foreground"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.18 }}
                  aria-live="polite"
                >
                  {travelers} {Number(travelers) > 1 ? "travelers" : "traveler"}
                </motion.span>
              </AnimatePresence>
              <button
                type="button"
                onClick={() => setTravelers((t) => String(Math.min(6, Number(t) + 1)))}
                disabled={isPaying || travelers === "6"}
                className="flex h-8 w-8 items-center justify-center rounded-md text-foreground transition-all hover:bg-muted active:scale-90 disabled:opacity-40 disabled:hover:bg-transparent"
                aria-label="Add one traveler"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="pay-date" className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              Travel date
            </label>
            <input
              id="pay-date"
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              disabled={isPaying}
              className="flex h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            />
          </div>
        </div>

        {/* Live total */}
        <div
          className="flex items-center justify-between rounded-lg border border-accent/20 bg-accent/5 px-4 py-3"
          role="status"
          aria-live="polite"
        >
          <span className="text-sm font-medium text-foreground">
            Total ({travelers} {Number(travelers) > 1 ? "travelers" : "traveler"})
          </span>
          <span className="font-display text-lg font-medium text-accent">
            {formatMoney(total)}
          </span>
        </div>

        {error && (
          <p role="alert" className="flex items-start gap-2 text-sm text-error">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {/* PRIMARY CTA */}
        <button
          type="submit"
          disabled={isPaying}
          className="btn-primary btn-shimmer w-full inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium"
        >
          {isPaying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              Redirecting to Secure Checkout...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" aria-hidden="true" />
              Book &amp; Pay Instantly — {formatMoney(total)}
            </>
          )}
        </button>
      </form>

      <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
        Instant confirmation. The price is locked server-side — no hidden fees, and your
        booking reference is created the moment payment completes.
      </p>
    </div>
  );
}
