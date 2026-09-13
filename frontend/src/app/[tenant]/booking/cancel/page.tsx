import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantConfig } from "@/lib/tenant/config";
import { Footer } from "@/components/travel/footer/Footer";
import { buttonLinkClass } from "@/lib/button-link";
import { XCircle, ArrowLeft } from "lucide-react";

interface CancelPageProps {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export async function generateMetadata({ params }: CancelPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const tenant = getTenantConfig(resolvedParams.tenant);
  if (!tenant) return { title: "Tenant Not Found" };
  return {
    title: `Payment Cancelled - ${tenant.name}`,
    description: "Your payment was cancelled — nothing was charged.",
    robots: { index: false, follow: false },
  };
}

export default async function BookingCancelPage({ params, searchParams }: CancelPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const tenant = getTenantConfig(resolvedParams.tenant);
  if (!tenant) notFound();

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <div className="container-page">
          <div className="max-w-2xl mx-auto text-center py-20 lg:py-28">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-error-light">
              <XCircle className="h-12 w-12 text-error" aria-hidden="true" />
            </div>

            <span className="label text-muted-foreground mb-4 inline-block">Checkout Abandoned</span>
            <h1 className="heading-section text-foreground mb-4">
              Payment Cancelled
            </h1>
            <p className="body-lg text-balance mb-3">
              No charge was made — your booking remains a pending request.
            </p>
            <p className="body-base text-muted-foreground mb-10">
              Changed your mind? Pick up right where you left off, or reach out
              and we&apos;ll help you finalize the details another way.
            </p>

            {resolvedSearchParams.session_id && (
              <p className="text-xs text-muted-foreground/70 mb-8 break-all">
                Reference: <span className="font-mono">{resolvedSearchParams.session_id}</span>
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`/${resolvedParams.tenant}/booking`}
                className={buttonLinkClass("default", "px-10 py-4")}
              >
                <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" />
                Try Again
              </Link>
              <Link
                href={`/${resolvedParams.tenant}/contact`}
                className={buttonLinkClass("secondary", "px-10 py-4")}
              >
                Talk to a Designer Instead
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer tenant={tenant} currentTenantSlug={resolvedParams.tenant} />
    </div>
  );
}
