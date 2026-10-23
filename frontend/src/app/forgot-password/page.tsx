"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidEmail } from "@/lib/password-policy";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "https://8d037e55-ee42-46aa-9371-a36de024c7dd-00-2m01srlp9rho5.pike.replit.dev";

const DEFAULT_TENANT = "demo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    if (!isValidEmail(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Resend-verification doubles as the account-recovery entry point until
      // a full reset flow is added to the backend.
      const res = await fetch(
        `${BACKEND_URL}/auth/resend-verification?email=${encodeURIComponent(email.trim())}&tenant_id=${DEFAULT_TENANT}`,
        { method: "POST" }
      );
      // Anti-enumeration: identical response regardless of account existence
      if (res.ok) {
        setSent(true);
      } else {
        setError("Something went wrong. Please try again in a moment.");
      }
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-page section-padding flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <Card className="glass-card elegant-shadow">
          <CardContent className="p-8 sm:p-10">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                <KeyRound className="h-6 w-6 text-accent" aria-hidden="true" />
              </div>
              <h1 className="heading-section text-foreground mb-2">Account Recovery</h1>
              <p className="body-base text-muted-foreground">
                {sent
                  ? "If an account exists for this email, a recovery link has been sent."
                  : "Enter your email and we'll send you a verification/recovery link."}
              </p>
            </div>

            {sent ? (
              <div className="text-center space-y-4" role="status" aria-live="polite">
                <CheckCircle2 className="mx-auto h-10 w-10 text-success" aria-hidden="true" />
                <p className="body-base text-muted-foreground">
                  Check <strong>{email}</strong> (and your spam folder).
                </p>
                <Link href="/login" className="btn-primary inline-block w-full py-3.5">
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="recovery-email">Email</Label>
                  <Input
                    id="recovery-email"
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={320}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                {error && (
                  <p role="alert" className="flex items-start gap-2 text-sm text-error" aria-live="polite">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                    {error}
                  </p>
                )}

                <Button type="submit" className="btn-primary w-full py-3.5" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Sending...
                    </>
                  ) : (
                    "Send Recovery Link"
                  )}
                </Button>
              </form>
            )}

            <p className="mt-8 text-center body-base text-muted-foreground">
              <Link href="/login" className="text-accent hover:underline font-medium">
                ← Back to Sign In
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
