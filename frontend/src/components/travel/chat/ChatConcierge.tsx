"use client";

/**
 * RAG Chat Concierge — floating widget (bottom-right).
 *
 * - Visible on every tenant page EXCEPT booking/checkout routes.
 * - Talks to the backend /chat endpoint (Groq server-side; the API key
 *   never reaches the browser).
 * - Typing indicator, message animations, dismissible + re-openable,
 *   keyboard accessible (Escape closes, focus management on open).
 * - Conversation history kept in component state and sent back for
 *   multi-turn context; cleared on dismiss.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, AlertCircle } from "lucide-react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://127.0.0.1:8000";

const easing = [0.22, 1, 0.36, 1] as const;

interface Msg {
  role: "user" | "assistant";
  content: string;
}

// Hide on checkout-sensitive routes
const HIDDEN_ON = ["/booking"];

export function ChatConcierge({ tenantSlug, tenantName }: { tenantSlug: string; tenantName: string }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);

  // Hide entirely on checkout/booking flows
  const isHiddenRoute = HIDDEN_ON.some((p) => pathname.includes(p));
  const hiddenByRoute = isHiddenRoute && !pathname.includes("/booking/success") && !pathname.includes("/booking/cancel");

  useEffect(() => {
    if (!isOpen) return;
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping, isOpen]);

  // Keyboard: Escape closes and restores focus to the launcher
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        openBtnRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  // Focus the input when the panel opens
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const send = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text || isTyping) return;
      setInput("");
      setError(null);

      const history = messages.slice(-8); // match backend cap
      const nextMessages: Msg[] = [...messages, { role: "user", content: text }];
      setMessages(nextMessages);
      setIsTyping(true);

      try {
        const res = await fetch(`${BACKEND_URL}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant_id: tenantSlug,
            message: text,
            history: history.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        const json = (await res.json().catch(() => null)) as
          | { reply?: string; detail?: string }
          | null;

        if (res.ok && json?.reply) {
          setMessages((m) => [...m, { role: "assistant", content: json.reply! }]);
        } else {
          const detail =
            typeof json?.detail === "string" ? json.detail : "The concierge is unavailable right now.";
          setError(detail);
        }
      } catch {
        setError("Network error — please check your connection and try again.");
      } finally {
        setIsTyping(false);
      }
    },
    [input, isTyping, messages, tenantSlug]
  );

  const dismiss = () => {
    setIsOpen(false);
    setMessages([]);
    setError(null);
    openBtnRef.current?.focus();
  };

  if (hiddenByRoute) return null;

  return (
    <>
      {/* Launcher */}
      <motion.button
        ref={openBtnRef}
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg"
        aria-label={isOpen ? "Close AI concierge chat" : "Open AI concierge chat"}
        aria-expanded={isOpen}
        whileHover={reduce ? undefined : { scale: 1.08 }}
        whileTap={reduce ? undefined : { scale: 0.92 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
              <X className="h-6 w-6" aria-hidden="true" />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
              <MessageCircle className="h-6 w-6" aria-hidden="true" />
            </motion.span>
          )}
        </AnimatePresence>
        {/* Unread pulse when closed and never used */}
        {!isOpen && messages.length === 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-accent" />
          </span>
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label="AI travel concierge chat"
            className="fixed bottom-24 right-6 z-[70] flex max-h-[70vh] w-[min(24rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
            initial={{ opacity: 0, y: reduce ? 0 : 24, scale: reduce ? 1 : 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : 16, scale: reduce ? 1 : 0.97 }}
            transition={{ duration: 0.28, ease: easing }}
            style={{ willChange: "opacity, transform" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border bg-primary px-4 py-3 text-on-primary">
              <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm font-medium leading-tight">AI Travel Concierge</p>
                <p className="text-xs opacity-70">{tenantName}</p>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
                aria-label="Dismiss chat and clear conversation"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
              {messages.length === 0 && (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Ask about destinations, prices, or journeys — I only answer from this
                    agency&apos;s live catalog.
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  initial={reduce ? undefined : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: easing }}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-md bg-primary text-on-primary"
                        : "rounded-bl-md bg-muted text-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start" role="status" aria-label="Concierge is typing">
                  <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-muted-foreground">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
              {error && (
                <div role="alert" className="flex items-start gap-2 text-sm text-error">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {error}
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={send} className="border-t border-border bg-background p-3" noValidate>
              <div className="flex items-center gap-2">
                <label htmlFor="chat-input" className="sr-only">
                  Ask the AI travel concierge
                </label>
                <input
                  ref={inputRef}
                  id="chat-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g., Which destination is best for diving?"
                  maxLength={2000}
                  disabled={isTyping}
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
