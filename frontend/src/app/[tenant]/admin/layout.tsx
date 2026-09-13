import { AuthGuard } from "@/components/ui/AuthGuard";

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout-level auth gate: EVERY route under /[tenant]/admin/* requires
 * a valid JWT. Unauthenticated or expired sessions redirect to
 * /login?next=<current path>. /login is never wrapped by this guard,
 * so the redirect terminates (no loop).
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AuthGuard>{children}</AuthGuard>;
}
