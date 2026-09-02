import { redirect } from "next/navigation";
import type { Metadata } from "next";

// Root URL showcases the product itself: redirect to the default tenant.
// 307 keeps it dev-friendly (cached only per-session); switch to permanentRedirect
// for a 308 once the default tenant slug is stable in production.
const DEFAULT_TENANT = "demo";

export const metadata: Metadata = {
  title: "Travel Agency Marketplace",
  description: "Ultra-premium multi-tenant travel marketplace platform",
};

export default function RootPage() {
  redirect(`/${DEFAULT_TENANT}`);
}
