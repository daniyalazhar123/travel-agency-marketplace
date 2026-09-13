"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Loader2, AlertCircle, Eye, EyeOff, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidEmail } from "@/lib/password-policy";
import { setSession } from "@/lib/session";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://127.0.0.1:8000";

const DEFAULT_TENANT = "demo";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
    ? nextParam
    : `/${DEFAULT_TENANT}/dashboard`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    if (!isValidEmail(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; detail?: string | { message?: string }; access_token?: string; user_id?: string; role?: string; tenant_id?: string }
        | null;

      if (res.ok && json?.access_token) {
        setSession(
          json.access_token,
          {
            id: json.user_id ?? "",
            email: email.trim(),
            role: json.role ?? "customer",
            tenant_id: json.tenant_id ?? DEFAULT_TENANT,
          },
          remember
        );
        router.push(safeNext);
      } else if (res.status === 403) {
        setError(
          "Your email isn't verified yet. Check your inbox for the verification link."
        );
      } else {
        const detail = json?.detail;
        setError(
          typeof detail === "string"
            ? detail
            : detail?.message ?? "Invalid email or password."
        );
      }
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <LogIn className="h-6 w-6 text-accent" aria-hidden="true" />
              </div>
              <h1 className="heading-section text-foreground mb-2">Welcome Back</h1>
              <p className="body-base text-muted-foreground">
                Sign in to access your journeys and bookings.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="login-email"
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
                    aria-invalid={!!error}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                  <Link
                    href={`/forgot-password`}
                    className="text-xs text-accent hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-11"
                    maxLength={128}
                    disabled={isSubmitting}
                    required
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
              </div>

              {error && (
                <p role="alert" className="flex items-start gap-2 text-sm text-error" aria-live="polite">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                    aria-label="Remember me on this device"
                  />
                  Remember me
                </label>
              </div>

              <Button
                type="submit"
                className="btn-primary w-full py-3.5"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <p className="mt-8 text-center body-base text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-accent hover:underline font-medium">
                Sign up
              </Link>
            </p>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              <Link href={`/${DEFAULT_TENANT}/explore`} className="hover:text-foreground transition-colors">
                ← Continue browsing as guest
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page section-padding flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden="true" />
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
