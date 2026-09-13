"use client";

/**
 * Lightweight CSS-only confetti burst — celebrates a successful booking.
 *
 * - No dependency, no canvas: 24 absolutely-positioned spans animated with
 *   transform/opacity (GPU-composited, 60fps).
 * - Honors prefers-reduced-motion (renders nothing).
 * - Auto-removes itself after 2.2s; pure decoration -> aria-hidden.
 */

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

const COLORS = ["#C6A15B", "#8FB8DE", "#E8C4C4", "#A3C9A8", "#D4C5F0", "#F0D9A3"];
const COUNT = 24;

interface Piece {
  left: number; // %
  delay: number; // s
  duration: number; // s
  drift: number; // px horizontal drift
  size: number; // px
  color: string;
  rotate: number; // deg
}

function makePieces(): Piece[] {
  return Array.from({ length: COUNT }, (_, i) => ({
    left: 5 + (i * 90) / COUNT + Math.random() * 6,
    delay: Math.random() * 0.35,
    duration: 1.4 + Math.random() * 0.8,
    drift: (Math.random() - 0.5) * 140,
    size: 6 + Math.random() * 6,
    color: COLORS[i % COLORS.length],
    rotate: Math.random() * 540 - 270,
  }));
}

export function Confetti() {
  const reduce = useReducedMotion();
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (reduce) return;
    setPieces(makePieces());
    const t = setTimeout(() => setVisible(false), 2400);
    return () => clearTimeout(t);
  }, [reduce]);

  if (reduce || !visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-[60vh] overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-[-12px] block rounded-[1px]"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.6}px`,
            backgroundColor: p.color,
            willChange: "transform, opacity",
            animation: `confetti-fall ${p.duration}s cubic-bezier(0.2, 0.6, 0.4, 1) ${p.delay}s forwards`,
            // custom props consumed by the keyframes in globals.css
            ["--drift" as string]: `${p.drift}px`,
            ["--rotate" as string]: `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}
