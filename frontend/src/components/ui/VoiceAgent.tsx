"use client";

/**
 * Floating AI Voice Assistant (Vapi Web SDK).
 *
 * A key 2026 SaaS feature: a floating, accessible button (bottom-right) that
 * starts a voice conversation with the site's AI travel assistant.
 *
 * States: idle -> connecting -> listening <-> speaking -> idle | error.
 *
 * Implementation notes:
 * - The Vapi SDK is browser-only (WebRTC + Node `events` polyfill), so it is
 *   DYNAMICALLY imported inside the click handler — a top-level import would
 *   break Next.js SSR/prerendering.
 * - Only the Vapi PUBLIC key is browser-exposed
 *   (NEXT_PUBLIC_VAPI_PUBLIC_KEY). Private keys live server-side only.
 * - Plain CSS transitions only — no Framer Motion yet (Phase 1 = functional).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mic, PhoneOff, AlertTriangle } from "lucide-react";
import type { CreateAssistantDTO } from "@vapi-ai/web/dist/api";

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
// Optional: reference a server-managed Vapi assistant instead of the inline
// transient definition below (recommended for production prompt management).
const VAPI_ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

type VoiceState = "idle" | "connecting" | "listening" | "speaking" | "error";

const STATE_LABEL: Record<VoiceState, string> = {
  idle: "Talk to our AI Travel Assistant",
  connecting: "Connecting…",
  listening: "Listening…",
  speaking: "Speaking…",
  error: "Voice unavailable",
};

// Transient assistant used when no server-managed assistant ID is configured.
// Voice/model providers fall back to whatever the Vapi account has enabled.
const INLINE_ASSISTANT: CreateAssistantDTO = {
  name: "Travel Concierge",
  firstMessage:
    "Hi! I'm your AI travel assistant. Where in the world are you dreaming of going?",
  model: {
    provider: "openai",
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a warm, concise AI travel concierge for a premium travel agency.
Help visitors discover destinations, experiences, stays, and flights. Keep answers short and conversational.
If someone wants to book or pay, guide them to the booking page. Never ask for payment details over the call.`,
      },
    ],
  },
  voice: { provider: "11labs", voiceId: "burt" },
};

export function VoiceAgent() {
  const [state, setState] = useState<VoiceState>("idle");
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);
  const vapiRef = useRef<{ stop: () => Promise<void> } | null>(null);

  const isCalling = state === "connecting" || state === "listening" || state === "speaking";

  const teardown = useCallback(() => {
    const vapi = vapiRef.current;
    vapiRef.current = null;
    if (vapi) {
      try {
        void vapi.stop();
      } catch {
        // SDK teardown errors are non-fatal
      }
    }
  }, []);

  // Always end any live call when the component unmounts (route change etc.)
  useEffect(() => teardown, [teardown]);

  const fail = useCallback(
    (message: string) => {
      setErrorHint(message);
      setState("error");
      teardown();
    },
    [teardown]
  );

  const startCall = useCallback(async () => {
    if (vapiRef.current) return; // guard double-start

    if (!VAPI_PUBLIC_KEY) {
      setBannerOpen(true);
      return;
    }

    setState("connecting");
    setErrorHint(null);

    try {
      // Browser-only SDK: loaded on demand, never during SSR.
      const { default: Vapi } = await import("@vapi-ai/web");
      const vapi = new Vapi(VAPI_PUBLIC_KEY);
      vapiRef.current = vapi;

      vapi.on("call-start", () => setState("listening"));
      vapi.on("speech-start", () => setState("speaking"));
      vapi.on("speech-end", () => setState("listening"));
      vapi.on("call-end", () => {
        vapiRef.current = null;
        setState("idle");
      });
      vapi.on("error", (err: unknown) => {
        console.error("[voice-agent] Vapi error:", err);
        const e = err as { errorMsg?: string; message?: string } | null;
        const detail =
          typeof e?.errorMsg === "string"
            ? e.errorMsg
            : typeof e?.message === "string"
              ? e.message
              : "unknown error";
        fail(`Voice error: ${detail}`);
      });

      // Server-managed assistant when configured; transient inline otherwise.
      await (VAPI_ASSISTANT_ID ? vapi.start(VAPI_ASSISTANT_ID) : vapi.start(INLINE_ASSISTANT));
    } catch (err) {
      console.error("[voice-agent] call start failed:", err);
      fail("Could not start the call — please try again.");
    }
  }, [fail]);

  const endCall = useCallback(() => {
    const vapi = vapiRef.current;
    if (vapi) {
      void vapi.stop();
      vapiRef.current = null;
    }
    setState("idle");
  }, []);

  const handleToggle = useCallback(() => {
    if (isCalling) {
      endCall();
    } else {
      void startCall();
    }
  }, [isCalling, endCall, startCall]);

  const buttonLabel = isCalling
    ? `End voice call — assistant ${STATE_LABEL[state].toLowerCase()}`
    : STATE_LABEL.idle;

  // ------------------------------------------------------------------
  // Not configured: show an explanatory popover on click instead of
  // failing silently. Keeps the feature discoverable in dev/demo builds.
  // ------------------------------------------------------------------
  if (!VAPI_PUBLIC_KEY) {
    return (
      <div
        className="fixed bottom-6 right-6 z-50"
        role="complementary"
        aria-label="AI travel assistant (not configured)"
      >
        {bannerOpen && (
          <div className="glass-card absolute bottom-16 right-0 w-72 p-4 elegant-shadow">
            <p className="text-sm font-medium text-foreground">
              Voice assistant coming soon
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              To enable it, set{" "}
              <code className="font-mono text-[11px]">NEXT_PUBLIC_VAPI_PUBLIC_KEY</code>{" "}
              in <code className="font-mono text-[11px]">frontend/.env</code>. In the
              meantime, our human designers are one message away.
            </p>
            <div className="mt-3 flex items-center justify-between">
              <Link
                href="/contact"
                onClick={() => setBannerOpen(false)}
                className="text-xs font-medium text-accent hover:underline"
              >
                Contact us instead
              </Link>
              <button
                type="button"
                onClick={() => setBannerOpen(false)}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Dismiss voice assistant notice"
              >
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setBannerOpen((open) => !open)}
          aria-expanded={bannerOpen}
          aria-label="AI travel assistant — not configured yet"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Mic className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Configured: floating button + live status pill.
  // ------------------------------------------------------------------
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3"
      role="complementary"
      aria-label="AI travel assistant"
    >
      {state === "error" && errorHint ? (
        <span
          role="alert"
          className="glass-card hidden max-w-56 items-center gap-2 rounded-full px-4 py-2 text-xs text-muted-foreground elegant-shadow sm:flex"
        >
          {errorHint}
        </span>
      ) : isCalling ? (
        <span
          role="status"
          aria-live="polite"
          className="glass-card hidden items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-foreground elegant-shadow sm:flex"
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              state === "listening" ? "bg-success" : "bg-accent"
            }`}
            aria-hidden="true"
          />
          {STATE_LABEL[state]}
        </span>
      ) : null}

      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={isCalling}
        aria-label={buttonLabel}
        className={`relative flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground shadow-lg transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          isCalling ? "bg-error hover:scale-100" : "bg-primary hover:scale-105"
        }`}
      >
        {isCalling ? (
          <PhoneOff className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Mic className="h-6 w-6" aria-hidden="true" />
        )}
        {/* Subtle pulse while live — plain CSS, no motion libraries */}
        {isCalling && (
          <span
            className="absolute inset-0 animate-pulse rounded-full border-2 border-primary"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
}
