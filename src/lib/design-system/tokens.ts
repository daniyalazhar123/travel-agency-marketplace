export const colors = {
  primary: {
    DEFAULT: "#0F172A",
    hover: "#1E293B",
    light: "#F8FAFC",
  },
  secondary: {
    DEFAULT: "#334155",
    hover: "#475569",
    light: "#F1F5F9",
  },
  accent: {
    DEFAULT: "#D97706",
    hover: "#B45309",
    light: "#FEF3C7",
    muted: "#FDE68A",
  },
  background: "#FAFAF9",
  surface: "#FFFFFF",
  surfaceHover: "#F8FAFC",
  foreground: "#0F172A",
  foregroundMuted: "#64748B",
  foregroundSubtle: "#94A3B8",
  border: "#E2E8F0",
  borderHover: "#CBD5E1",
  borderFocus: "#D97706",
  success: "#059669",
  successLight: "#D1FAE5",
  warning: "#D97706",
  warningLight: "#FEF3C7",
  error: "#DC2626",
  errorLight: "#FEF2F2",
  ring: "#D97706",
} as const;

export const typography = {
  fontDisplay: "var(--font-cormorant)",
  fontBody: "var(--font-montserrat)",
  fontMono: "var(--font-geist-mono)",

  sizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
    "6xl": "3.75rem",
    "7xl": "4.5rem",
    "8xl": "6rem",
    "9xl": "8rem",
  },
  leading: {
    tight: "1.1",
    snug: "1.375",
    normal: "1.5",
    relaxed: "1.625",
    loose: "2",
  },
  tracking: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },
  weights: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
} as const;

export const spacing = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  32: "8rem",
  40: "10rem",
  48: "12rem",
  56: "14rem",
  64: "16rem",
} as const;

export const radii = {
  none: "0",
  xs: "0.125rem",
  sm: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  "3xl": "1.5rem",
  full: "9999px",
} as const;

export const shadows = {
  xs: "0 1px 2px 0 rgb(15 23 42 / 0.03)",
  sm: "0 1px 3px 0 rgb(15 23 42 / 0.05), 0 1px 2px -1px rgb(15 23 42 / 0.05)",
  md: "0 4px 6px -1px rgb(15 23 42 / 0.05), 0 2px 4px -2px rgb(15 23 42 / 0.05)",
  lg: "0 10px 15px -3px rgb(15 23 42 / 0.05), 0 4px 6px -4px rgb(15 23 42 / 0.05)",
  xl: "0 20px 25px -5px rgb(15 23 42 / 0.05), 0 8px 10px -6px rgb(15 23 42 / 0.05)",
  "2xl": "0 25px 50px -12px rgb(15 23 42 / 0.1)",
  inner: "inset 0 2px 4px 0 rgb(15 23 42 / 0.05)",
  elegant: "0 4px 24px -4px rgb(15 23 42 / 0.08), 0 2px 8px -2px rgb(15 23 42 / 0.04)",
  elegantHover: "0 12px 32px -8px rgb(15 23 42 / 0.12), 0 4px 16px -4px rgb(15 23 42 / 0.06)",
  glass: "0 4px 24px -4px rgb(15 23 42 / 0.06), 0 2px 8px -2px rgb(15 23 42 / 0.03)",
  glassHover: "0 8px 32px -8px rgb(15 23 42 / 0.1), 0 4px 16px -4px rgb(15 23 42 / 0.05)",
} as const;

export const transitions = {
  fast: "120ms cubic-bezier(0.4, 0, 0.2, 1)",
  base: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
  slower: "500ms cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export const easing = {
  ease: "cubic-bezier(0.4, 0, 0.2, 1)",
  easeOut: "cubic-bezier(0, 0, 0.2, 1)",
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export const containers = {
  xs: "320px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1440px",
  "3xl": "1600px",
  full: "100%",
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export const zIndices = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modal: 400,
  popover: 500,
  tooltip: 600,
  toast: 700,
} as const;