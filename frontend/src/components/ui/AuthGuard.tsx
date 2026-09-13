"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { clearSession, getToken, validateToken } from "@/lib/session";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Path to send the user to after login. Defaults to current path. */
  redirectTo?: string;
}

type GuardState = "checking" | "authenticated" | "unauthenticated";

/**
 * Client-side auth guard for protected tenant routes (dashboard, admin).
 *
 * Flow:
 *  1. No token at all -> immediate redirect to /login?next=<path> (no loop:
 *     /login is never wrapped by this guard).
 *  2. Token present -> server-side validation via /auth/me. Invalid/expired
 *     token -> clear session, redirect once. Valid -> render children.
 */
export function AuthGuard({ children, redirectTo }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<GuardState>("checking");

  const target = redirectTo ?? pathname;

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const token = getToken();
      if (!token) {
        setState("unauthenticated");
        router.replace(`/login?next=${encodeURIComponent(target)}`);
        return;
      }

      // Token exists — validate it server-side (catches expired/tampered)
      const user = await validateToken(token);
      if (cancelled) return;
      if (user) {
        setState("authenticated");
      } else {
        clearSession();
        setState("unauthenticated");
        router.replace(`/login?next=${encodeURIComponent(target)}`);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [router, target]);

  if (state === "checking") {
    // Loading skeleton — mirrors the real page shape so there is no
    // flash-of-unauthenticated-content; purely decorative shimmer.
    return (
      <div className="container-page section-padding min-h-[60vh]" aria-busy="true" aria-live="polite">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="flex flex-col items-center gap-3">
            {/* Visually hidden status for screen readers */}
            <span className="sr-only" role="status">Checking your session...</span>
            <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-96 max-w-full animate-pulse rounded-md bg-muted/70" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="h-48 animate-pulse rounded-2xl bg-muted/60" />
            <div className="h-48 animate-pulse rounded-2xl bg-muted/60" />
          </div>
          <div className="h-32 animate-pulse rounded-2xl bg-muted/40" />
        </div>
      </div>
    );
  }

  if (state === "unauthenticated") {
    // Brief lock screen while the redirect completes
    return (
      <div className="container-page section-padding flex flex-col items-center justify-center gap-4 min-h-[60vh]">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <Lock className="h-6 w-6 text-accent" aria-hidden="true" />
        </div>
        <p className="text-sm text-muted-foreground" role="status">
          Redirecting to sign in...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
