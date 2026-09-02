"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://127.0.0.1:8000";

type VerifyState =
  | { kind: "idle" }
  | { kind: "verifying" }
  | { kind: "success" }
  | { kind: "error"; message: string }
  | { kind: "already-verified" };

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const status = searchParams.get("status") ?? "";

  const [state, setState] = useState<VerifyState>({ kind: "idle" });
  const [resendEmail, setResendEmail] = useState("");
  const [resendTenant, setResendTenant] = useState("demo");
  const [isResending, setIsResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);

  // Backend already redirected with ?status= — trust it without a second network call
  useEffect(() => {
    if (status === "success") {
      setState({ kind: "success" });
    } else if (status === "already-verified") {
      setState({ kind: "already-verified" });
    } else if (status === "invalid") {
      setState({ kind: "error", message: "This verification link is invalid or has expired. Request a new one below." });
    } else if (token) {
      // Direct visit with a raw token (no status) — verify it now
      setState({ kind: "verifying" });
      fetch(`${BACKEND_URL}/auth/verify-email?token=${encodeURIComponent(token)}`, {
        method: "GET",
        redirect: "follow",
      })
        .then((res) => {
          // Backend redirects to /verify-email?status=... — success if final URL is success
          const url = new URL(res.url);
          const finalStatus = url.searchParams.get("status");
          if (res.ok && finalStatus === "success") {
            setState({ kind: "success" });
          } else if (finalStatus === "already-verified") {
            setState({ kind: "already-verified" });
          } else {
            setState({ kind: "error", message: "This verification link is invalid or has expired. Request a new one below." });
          }
        })
        .catch(() =>
          setState({ kind: "error", message: "We couldn't reach the verification service. Please try again in a moment." })
        );
    } else {
      // No token, no status — direct navigation to the page
      setState({ kind: "error", message: "No verification token found. If you just created an account, check your inbox for the link." });
    }
  }, [status, token]);

  const handleResend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(resendEmail)) {
      setResendFeedback("Please enter a valid email address.");
      return;
    }
    setIsResending(true);
    setResendFeedback(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/auth/resend-verification?email=${encodeURIComponent(resendEmail)}&tenant_id=${encodeURIComponent(resendTenant)}`,
        { method: "POST" }
      );
      // Anti-enumeration: same 200 message regardless of account existence
      if (res.ok) {
        setResendFeedback("If an unverified account exists for this email, a new verification link has been sent. Please check your inbox.");
        setResendEmail("");
      } else {
        setResendFeedback("Something went wrong. Please try again in a moment.");
      }
    } catch {
      setResendFeedback("Network error — please check your connection and try again.");
    } finally {
      setIsResending(false);
    }
  }, [resendEmail, resendTenant]);

  const headings = useMemo(
    () => ({
      success: "Email Verified!",
      already: "Already Verified",
      error: "Verification Problem",
      verifying: "Verifying Your Email...",
      idle: "Email Verification",
    }),
    []
  );

  return (
    <div className="container-page section-padding flex items-center justify-center bg-background">
      <div className="w-full max-w-xl">
        <Card className="glass-card elegant-shadow text-center">
          <CardContent className="p-8 sm:p-12">
            {/* Icon */}
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full">
              {state.kind === "success" && (
                <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
              )}
              {(state.kind === "error" || state.kind === "already-verified") && (
                <AlertCircle className={`h-10 w-10 ${state.kind === "already-verified" ? "text-success" : "text-error"}`} aria-hidden="true" />
              )}
              {(state.kind === "verifying" || state.kind === "idle") && (
                <Loader2 className="h-10 w-10 animate-spin text-accent" aria-hidden="true" />
              )}
            </div>

            {/* Heading */}
            <h1 className="heading-section text-foreground mb-4" id="verify-email-heading">
              {state.kind === "success"
                ? headings.success
                : state.kind === "already-verified"
                  ? headings.already
                  : state.kind === "error"
                    ? headings.error
                    : state.kind === "verifying"
                      ? headings.verifying
                      : headings.idle}
            </h1>

            {/* Body */}
            {state.kind === "success" && (
              <p className="body-lg text-muted-foreground mb-10 text-balance">
                Your email address is confirmed. Your account is now active —
                welcome aboard! Start exploring extraordinary destinations.
              </p>
            )}
            {state.kind === "already-verified" && (
              <p className="body-lg text-muted-foreground mb-10 text-balance">
                This email address has already been verified. You're all set —
                no further action needed.
              </p>
            )}
            {state.kind === "error" && (
              <p className="body-lg text-muted-foreground mb-10 text-balance" role="alert">
                {state.message}
              </p>
            )}
            {(state.kind === "verifying" || state.kind === "idle") && (
              <p className="body-lg text-muted-foreground mb-10 text-balance">
                Hold tight — we're confirming your email address right now.
              </p>
            )}

            {/* Primary actions */}
            {(state.kind === "success" || state.kind === "already-verified") && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/demo/explore" className="btn-primary group px-8 py-3.5">
                  Start Exploring
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <Link href="/demo/booking" className="btn-secondary px-8 py-3.5">
                  Plan a Journey
                </Link>
              </div>
            )}

            {/* Resend form (error state) */}
            {state.kind === "error" && (
              <form onSubmit={handleResend} className="space-y-4 text-left">
                <div className="space-y-2">
                  <Label htmlFor="resend-email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="resend-email"
                      type="text"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="pl-12"
                      maxLength={320}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="btn-primary w-full py-3.5" disabled={isResending}>
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
                {resendFeedback && (
                  <p className="text-sm text-muted-foreground text-center pt-2" role="status" aria-live="polite">
                    {resendFeedback}
                  </p>
                )}
              </form>
            )}

            <p className="mt-10 text-xs text-muted-foreground">
              Wrong email or need help?{" "}
              <Link href="/demo/contact" className="text-accent hover:underline">
                Contact our team
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page section-padding flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden="true" />
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
