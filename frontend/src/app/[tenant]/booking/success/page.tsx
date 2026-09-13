import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantConfig } from "@/lib/tenant/config";
import { Footer } from "@/components/travel/footer/Footer";
import { Confetti } from "@/components/travel/booking/Confetti";
import { AnimatedCheckmark } from "@/components/travel/booking/AnimatedCheckmark";
import { buttonLinkClass } from "@/lib/button-link";
import { ArrowRight, Calendar, Sparkles } from "lucide-react";

interface SuccessPageProps {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export async function generateMetadata({ params }: SuccessPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const tenant = getTenantConfig(resolvedParams.tenant);
  if (!tenant) return { title: "Tenant Not Found" };
  return {
    title: `Payment Successful - ${tenant.name}`,
    description: "Your booking is confirmed.",
    robots: { index: false, follow: false },
  };
}

export default async function BookingSuccessPage({ params, searchParams }: SuccessPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const tenant = getTenantConfig(resolvedParams.tenant);
  if (!tenant) notFound();

  return (
    <div className="min-h-screen bg-background">
      <Confetti />
      <main className="pb-16">
        <div className="container-page">
          <div className="max-w-2xl mx-auto text-center py-20 lg:py-28">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-success-light">
              <AnimatedCheckmark className="h-12 w-12 text-success" />
            </div>

            <span className="label text-accent mb-4 inline-block">Payment Confirmed</span>
            <h1 className="heading-section text-foreground mb-4">
              Payment Successful!
            </h1>
            <p className="body-lg text-balance mb-3">
              Your booking is confirmed. A confirmation email with your itinerary
              details is on its way.
            </p>
            <p className="body-base text-muted-foreground mb-10">
              Our travel designers will be in touch within 24 hours to finalize
              the finer details of your journey.
            </p>

            {resolvedSearchParams.session_id && (
              <p className="text-xs text-muted-foreground/70 mb-8 break-all">
                Reference: <span className="font-mono">{resolvedSearchParams.session_id}</span>
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`/${resolvedParams.tenant}/dashboard`}
                className={buttonLinkClass("default", "px-10 py-4")}
              >
                <Calendar className="w-5 h-5 mr-2" aria-hidden="true" />
                Go to Dashboard
              </Link>
              <Link
                href={`/${resolvedParams.tenant}/explore`}
                className={buttonLinkClass("secondary", "px-10 py-4")}
              >
                <Sparkles className="w-5 h-5 mr-2" aria-hidden="true" />
                Explore More Journeys
              </Link>
            </div>

            <p className="mt-10 text-sm text-muted-foreground">
              Questions about your booking?{" "}
              <Link
                href={`/${resolvedParams.tenant}/contact`}
                className="text-accent hover:underline font-medium"
              >
                Contact your travel designer
                <ArrowRight className="inline w-3.5 h-3.5 ml-1" aria-hidden="true" />
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer tenant={tenant} currentTenantSlug={resolvedParams.tenant} />
    </div>
  );
}
