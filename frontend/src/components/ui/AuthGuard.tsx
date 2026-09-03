"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
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
    return (
      <div className="container-page section-padding flex flex-col items-center justify-center gap-4 min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden="true" />
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          Checking your session...
        </p>
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
