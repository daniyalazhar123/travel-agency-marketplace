"use client";

/**
 * Page transitions + micro-interaction primitives (Framer Motion).
 *
 * - PageTransition: fade-in + slide-up on first mount of every route.
 *   Because app router remounts children per navigation, wrapping each
 *   page's content in <PageTransition> gives a consistent entrance.
 * - FadeUp: scroll-triggered fade/slide for sections (whileInView).
 * - StaggerGrid: staggered children entrance for card grids.
 * - HoverScale: button/card scale + shadow micro-interaction.
 *
 * All variants respect prefers-reduced-motion via Framer Motion's
 * useReducedMotion in PageTransition (falls back to opacity-only).
 */

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const easing = [0.22, 1, 0.36, 1] as const;

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: easing } },
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

/** Route-level entrance: fade + slide-up. Wrap page content. */
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: easing }}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
}

/** Scroll-triggered section reveal. */
export function FadeUp({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={fadeUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      custom={delay}
      transition={reduce ? { duration: 0.01 } : { duration: 0.55, ease: easing, delay }}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
}

/** Staggered grid entrance for destination cards. */
export function StaggerGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={staggerContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

/** Scale + shadow hover micro-interaction for buttons and cards. */
export function HoverScale({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      whileHover={reduce ? undefined : { scale: 1.02, boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{ willChange: "transform" }}
    >
      {children}
    </motion.div>
  );
}
