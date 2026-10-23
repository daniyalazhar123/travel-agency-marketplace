"use client";

/**
 * Premium scroll engine — Lenis inertia scrolling + GSAP ScrollTrigger.
 *
 * Mounted once from the root layout (`src/app/layout.tsx`), so every page and
 * tenant shares a single clock:
 *
 * 1. GSAP core + ScrollTrigger are dynamically imported (code-split,
 *    client-only) and registered before any component can create a trigger.
 * 2. Lenis drives the page with weighted inertia — a longer glide with a soft
 *    settle instead of a snappy instant stop — and owns `#hash` anchor links.
 * 3. Sync: Lenis `scroll` → `ScrollTrigger.update()`, and the GSAP ticker
 *    drives `lenis.raf()` (with `lagSmoothing(0)`) so scroll-linked tweens
 *    never drift, stutter, or double-step.
 *
 * Notes:
 * - prefers-reduced-motion: Lenis is skipped entirely (native scrolling),
 *   while ScrollTrigger stays registered so scroll animations still resolve.
 * - Form controls / embedded media keep native scrolling (Lenis default),
 *   and `data-lenis-prevent` opts any region out explicitly.
 * - Everything is torn down on unmount (ticker, listeners, Lenis instance),
 *   so React StrictMode double-mounting is safe.
 */

import { useEffect } from "react";

/** Minimal structural types: load GSAP lazily without tight type coupling. */
type GsapLike = {
  registerPlugin: (plugin: unknown) => void;
  ticker: {
    add: (callback: (timeSeconds: number) => void) => void;
    remove: (callback: (timeSeconds: number) => void) => void;
    /** Disables GSAP's lag smoothing so scroll tweens stay frame-accurate. */
    lagSmoothing: (threshold: number | boolean, adjustedLag?: number) => void;
  };
  plugins?: Record<string, unknown>;
};

type ScrollTriggerLike = {
  update: () => void;
  refresh: (hard?: boolean) => void;
};

type LenisLike = {
  raf: (time: number) => void;
  destroy: () => void;
  scrollTo: (
    target: string | number | HTMLElement,
    options?: Record<string, unknown>
  ) => void;
  on: (event: string, callback: (payload: unknown) => void) => void;
  off?: (event: string, callback: (payload: unknown) => void) => void;
};

/**
 * The `lenis` package already augments `Window` with a loosely-typed `lenis`
 * slot, so we bridge to it here instead of re-declaring the global.
 */
/** Guards against double registration when StrictMode re-runs effects. */
let gsapRegistered = false;

const setWindowLenis = (instance: LenisLike | null) => {
  (window as unknown as { lenis?: LenisLike }).lenis = instance ?? undefined;
};

export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let cancelled = false;
    let lenisInstance: LenisLike | null = null;
    let fallbackRafId = 0;
    let releaseTicker: (() => void) | null = null;
    let onScroll: ((payload: unknown) => void) | null = null;
    let onClick: ((event: MouseEvent) => void) | null = null;

    void (async () => {
      // --- 1. GSAP + ScrollTrigger (lazily code-split, client-only) -------
      let gsap: GsapLike | undefined;
      let ScrollTrigger: ScrollTriggerLike | undefined;

      try {
        const [gsapModule, scrollTriggerModule] = await Promise.all([
          import("gsap") as Promise<unknown>,
          import("gsap/ScrollTrigger") as Promise<unknown>,
        ]);

        const gsapNs = gsapModule as {
          gsap?: GsapLike;
          default?: GsapLike;
        };
        const stNs = scrollTriggerModule as {
          ScrollTrigger?: ScrollTriggerLike;
          default?: ScrollTriggerLike;
        };

        gsap = gsapNs.gsap ?? gsapNs.default;
        ScrollTrigger = stNs.ScrollTrigger ?? stNs.default;

        if (gsap && ScrollTrigger && !gsapRegistered) {
          gsap.registerPlugin(ScrollTrigger);
          gsapRegistered = true;
        }
      } catch (error) {
        // Non-fatal: page still scrolls (Lenis falls back to its own rAF loop).
        console.warn("[SmoothScroll] GSAP/ScrollTrigger unavailable:", error);
      }

      if (cancelled) return;

      // Reduced motion: keep native scrolling, ScrollTrigger already registered.
      if (reducedMotion) return;

      // --- 2. Lenis — weighted, premium inertia ---------------------------
      const { default: Lenis } = await import("lenis");
      if (cancelled) return;

      const lenis = new Lenis({
        // Heavier than the 1.0s default: confident start, long soft settle.
        duration: 1.4,
        easing: (t: number) => 1 - Math.pow(1 - t, 3), // cubic-out
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
        infinite: false,
      }) as unknown as LenisLike;

      lenisInstance = lenis;
      setWindowLenis(lenis);

      // --- 3. Single clock: Lenis ↔ GSAP ----------------------------------
      if (gsap && ScrollTrigger) {
        onScroll = () => ScrollTrigger?.update();
        lenis.on("scroll", onScroll);

        const tick = (timeSeconds: number) => {
          lenis.raf(timeSeconds * 1000); // GSAP ticker reports seconds
        };
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0); // no catch-up jumps after tab refocus
        releaseTicker = () => gsap?.ticker.remove(tick);
      } else {
        const raf = (time: number) => {
          lenis.raf(time);
          fallbackRafId = requestAnimationFrame(raf);
        };
        fallbackRafId = requestAnimationFrame(raf);
      }

      // --- 4. Same-page `#hash` links animate through Lenis ---------------
      onClick = (event: MouseEvent) => {
        const anchor = (event.target as HTMLElement | null)?.closest?.(
          'a[href*="#"]'
        ) as HTMLAnchorElement | null;
        if (!anchor) return;

        const href = anchor.getAttribute("href") ?? "";
        if (!href.startsWith("#")) return; // cross-page links keep Next routing

        const id = href.slice(1);
        if (!id) return; // bare "#" — let the browser reset scroll

        if (document.getElementById(id)) {
          event.preventDefault();
          lenis.scrollTo(`#${id}`, { offset: -96 }); // nav height offset
        }
      };
      document.addEventListener("click", onClick, { passive: false });
    })();

    return () => {
      cancelled = true;
      if (onClick) document.removeEventListener("click", onClick);
      if (onScroll) lenisInstance?.off?.("scroll", onScroll);
      releaseTicker?.();
      if (fallbackRafId) cancelAnimationFrame(fallbackRafId);
      if (lenisInstance) setWindowLenis(null);
      lenisInstance?.destroy();
      lenisInstance = null;
    };
  }, []);

  return null;
}
