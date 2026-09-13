"use client";

/**
 * Route transition template — App Router re-mounts this wrapper on every
 * navigation, so every route under /[tenant] gets the same fade-in +
 * slide-up entrance without per-page boilerplate.
 *
 * Performance: animates transform + opacity only (GPU-composited) and
 * respects prefers-reduced-motion (instant, no slide).
 */

import { motion, useReducedMotion } from "framer-motion";

export default function TenantTemplate({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
}
