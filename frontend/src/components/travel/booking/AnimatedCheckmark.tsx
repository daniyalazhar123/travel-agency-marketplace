"use client";

/**
 * Animated checkmark — SVG path-draw + scale-in for the booking success page.
 *
 * - The circle strokes in (pathLength 0 -> 1), then the check pops with a
 *   spring. GPU-friendly: transform + opacity + stroke-dashoffset only.
 * - prefers-reduced-motion: renders the final state instantly.
 */

import { motion, useReducedMotion } from "framer-motion";

export function AnimatedCheckmark({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const dur = reduce ? 0 : 0.5;

  return (
    <motion.svg
      viewBox="0 0 52 52"
      className={className}
      initial={reduce ? undefined : { scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      aria-hidden="true"
      focusable="false"
    >
      {/* Circle */}
      <motion.circle
        cx="26"
        cy="26"
        r="24"
        fill="none"
        strokeWidth="2.5"
        stroke="currentColor"
        initial={reduce ? undefined : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur, ease: "easeOut" }}
      />
      {/* Check */}
      <motion.path
        d="M14 27 L22 35 L38 17"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
        initial={reduce ? undefined : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: dur, ease: "easeOut", delay: reduce ? 0 : 0.3 }}
      />
    </motion.svg>
  );
}
