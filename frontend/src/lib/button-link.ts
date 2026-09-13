import { cn } from "@/lib/utils";

/**
 * Server-safe button-styled Link classes.
 *
 * WHY THIS EXISTS
 * <Button asChild><Link/></Button> (Base UI render-prop composition) renders
 * <button> on the server and <a> on the client -> hydration mismatch on every
 * server-component page that used it. These class builders replicate the cva
 * Button styles exactly so pages can use plain <Link> with button styling —
 * identical output on server and client, zero "use client" needed.
 *
 * Class strings mirror @/components/ui/button.tsx buttonVariants 1:1.
 */

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0";

export function buttonLinkClass(
  variant: "default" | "secondary" | "outline" | "ghost" = "default",
  className?: string
): string {
  const variantClass = {
    default: "bg-primary text-primary-foreground hover:bg-primary/80",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
    outline:
      "border-border bg-background hover:bg-muted hover:text-foreground",
    ghost: "hover:bg-muted hover:text-foreground",
  }[variant];

  return cn(BASE, variantClass, className);
}
