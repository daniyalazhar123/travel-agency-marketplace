"use client";

/**
 * Lenis smooth scrolling — client-only provider.
 *
 * - Respects prefers-reduced-motion (skips entirely).
 * - Native-feeling for form inputs/selects (Lenis ignores them by default).
 * - Anchor links (`#id`) bypass Lenis via a click interceptor that calls
 *   lenis.scrollTo for buttery anchors instead of the instant jump.
 * - Cleanup on unmount is handled by the raf loop teardown + destroy().
 */

import { useEffect } from "react";

type LenisLike = {
  raf: (time: number) => void;
  destroy: () => void;
  scrollTo: (target: string | number | HTMLElement, options?: Record<string, unknown>) => void;
  on: (event: string, cb: (e: { scroll: number }) => void) => void;
};

export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let lenis: LenisLike | null = null;
    let rafId = 0;
    let cancelled = false;

    void (async () => {
      const { default: Lenis } = await import("lenis");
      if (cancelled) return;

      lenis = new Lenis({
        duration: 1.1,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
        infinite: false,
      }) as unknown as LenisLike;

      const raf = (time: number) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      // Anchor links: intercept in-page #hash links so Lenis animates them.
      const onClick = (e: MouseEvent) => {
        const anchor = (e.target as HTMLElement | null)?.closest?.(
          'a[href*="#"]'
        ) as HTMLAnchorElement | null;
        if (!anchor) return;
        const href = anchor.getAttribute("href") ?? "";
        // Only same-page hash links (start with # or contain # after a path)
        if (href.startsWith("#")) {
          const id = href.slice(1);
          if (!id) return; // bare "#" — let default reset-scroll happen
          const el = document.getElementById(id);
          if (el) {
            e.preventDefault();
            lenis?.scrollTo(`#${id}`, { offset: -96 }); // nav height offset
          }
        }
      };
      document.addEventListener("click", onClick, { passive: false });
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      lenis?.destroy();
    };
  }, []);

  return null;
}
