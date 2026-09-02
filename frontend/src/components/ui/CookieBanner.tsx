"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "cookie-consent";

type ConsentChoice = "accepted" | "essential-only";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const acceptRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Derive tenant-scoped privacy link from current path (e.g. /demo/... -> /demo/privacy)
  const tenantSlug = pathname?.split("/")[1] ?? "demo";
  const privacyHref = `/${tenantSlug}/privacy`;

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Small delay so it doesn't fight the hero animation for attention
        const t = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage unavailable (private mode) — don't nag, don't crash
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      // Move focus to the banner's primary action for keyboard/screen-reader users
      acceptRef.current?.focus();
    }
  }, [visible]);

  const decide = (choice: ConsentChoice) => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Storage blocked — still hide for this session
    }
    setVisible(false);
  };

  // Don't render until mounted (SSR has no localStorage) or if consent recorded
  if (!mounted || !visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[60] p-4 sm:p-6"
    >
      <div
        role="alert"
        aria-live="polite"
        className="glass-card mx-auto max-w-3xl flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 sm:p-6 elegant-shadow"
      >
        <div className="flex items-start gap-4 flex-1">
          <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
            <Cookie className="h-5 w-5 text-accent" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              We respect your privacy
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This site uses only essential storage for security and your preferences — no
              advertising or third-party trackers. See our{" "}
              <Link
                href={privacyHref}
                className="text-accent hover:underline font-medium"
                onClick={() => decide("essential-only")}
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto">
          <button
            ref={acceptRef}
            type="button"
            onClick={() => decide("accepted")}
            className="btn-primary text-sm px-6 py-2.5 rounded-lg whitespace-nowrap"
          >
            Got it
          </button>
          <button
            type="button"
            onClick={() => decide("essential-only")}
            className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Dismiss cookie notice without changes"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
