import { AuthGuard } from "@/components/ui/AuthGuard";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout-level auth gate: EVERY route under /[tenant]/dashboard/* requires
 * a valid JWT. Unauthenticated or expired sessions redirect to
 * /login?next=<current path>. /login is never wrapped by this guard,
 * so the redirect terminates (no loop).
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <AuthGuard>{children}</AuthGuard>;
}
