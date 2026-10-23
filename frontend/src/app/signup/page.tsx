"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { UserPlus, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2, Mail, User } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidEmail, passwordChecklist, validatePassword } from "@/lib/password-policy";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "https://8d037e55-ee42-46aa-9371-a36de024c7dd-00-2m01srlp9rho5.pike.replit.dev";

const DEFAULT_TENANT = "demo";

function SignupInner() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const checklist = passwordChecklist(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    if (fullName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    const policyErrors = validatePassword(password);
    if (policyErrors.length > 0) {
      setError(policyErrors[0]);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: DEFAULT_TENANT,
          email: email.trim(),
          full_name: fullName.trim(),
          password,
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { message?: string; detail?: string | { message?: string; errors?: string[] } }
        | null;

      if (res.ok) {
        setSucceeded(true);
      } else if (res.status === 409) {
        setError("An account with this email already exists. Try signing in instead.");
      } else if (res.status === 422) {
        const errs = json?.detail && typeof json.detail === "object" ? json.detail.errors : null;
        const msg = json?.detail && typeof json.detail === "object" ? json.detail.message : null;
        setError(errs?.length ? errs[0] : msg ?? "Please review the form and try again.");
      } else {
        const msg = json?.message ?? (typeof json?.detail === "string" ? json.detail : null);
        setError(msg ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state: verification email dispatched — no auto-login (by design,
  // email verification is required before login is permitted).
  if (succeeded) {
    return (
      <div className="container-page section-padding flex items-center justify-center bg-background">
        <div className="w-full max-w-md">
          <Card className="glass-card elegant-shadow text-center">
            <CardContent className="p-8 sm:p-10">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
                <CheckCircle2 className="h-8 w-8 text-success" aria-hidden="true" />
              </div>
              <h1 className="heading-card text-foreground mb-3">Check Your Inbox</h1>
              <p className="body-base text-muted-foreground mb-8" role="status" aria-live="polite">
                We&apos;ve sent a verification link to <strong>{email}</strong>.
                Click it to activate your account, then sign in.
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/login" className="btn-primary w-full py-3.5">
                  Go to Sign In
                </Link>
                <Link href={`/${DEFAULT_TENANT}/explore`} className="btn-ghost w-full py-3.5">
                  Continue Browsing
                </Link>
              </div>
              <p className="mt-6 text-xs text-muted-foreground">
                Didn&apos;t receive it? Check your spam folder, or request a new link from the sign-in page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page section-padding flex items-center justify-center bg-background">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{ willChange: "opacity, transform" }}
      >
        <Card className="glass-card elegant-shadow">
          <CardContent className="p-8 sm:p-10">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                <UserPlus className="h-6 w-6 text-accent" aria-hidden="true" />
              </div>
              <h1 className="heading-section text-foreground mb-2">Create Account</h1>
              <p className="body-base text-muted-foreground">
                Join to save journeys, sync bookings, and unlock members-only experiences.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-11"
                    maxLength={200}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="signup-email"
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11"
                    maxLength={320}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-11"
                    maxLength={128}
                    disabled={isSubmitting}
                    required
                    aria-describedby="password-checklist"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>

                {/* Real-time policy checklist */}
                {password.length > 0 && (
                  <ul id="password-checklist" className="space-y-1.5 pt-1" role="list" aria-label="Password requirements">
                    {checklist.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-2 text-xs"
                        aria-live="off"
                      >
                        {item.passed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" aria-hidden="true" />
                        ) : (
                          <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-border" aria-hidden="true" />
                        )}
                        <span className={item.passed ? "text-success" : "text-muted-foreground"}>
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm">Confirm Password</Label>
                <Input
                  id="signup-confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  maxLength={128}
                  disabled={isSubmitting}
                  required
                  aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
                />
                {confirmPassword.length > 0 && (
                  <p className={`text-xs ${passwordsMatch ? "text-success" : "text-error"}`} role="status">
                    {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                  </p>
                )}
              </div>

              {error && (
                <p role="alert" className="flex items-start gap-2 text-sm text-error" aria-live="polite">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="btn-primary w-full py-3.5"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Create Account
                  </>
                )}
              </Button>
            </form>

            <p className="mt-8 text-center body-base text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-accent hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page section-padding flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden="true" />
        </div>
      }
    >
      <SignupInner />
    </Suspense>
  );
}
