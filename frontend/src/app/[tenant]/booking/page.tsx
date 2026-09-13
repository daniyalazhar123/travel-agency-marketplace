import { Metadata } from "next";
import { getTenantConfig } from "@/lib/tenant/config";
import { Footer } from "@/components/travel/footer/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { buttonLinkClass } from "@/lib/button-link";
import { Users, Compass, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";
import { BookingForm } from "@/components/travel/booking/BookingForm";

interface TenantPageProps {
  params: Promise<{ tenant: string }>;
}

export async function generateMetadata({ params }: TenantPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const tenant = getTenantConfig(resolvedParams.tenant);

  if (!tenant) {
    return { title: "Tenant Not Found" };
  }

  return {
    title: `Book Your Journey - ${tenant.name}`,
    description: `Search and book flights, stays, and experiences with ${tenant.name}. ${tenant.description}`,
  };
}

export default async function TenantBookingPage({ params }: TenantPageProps) {
  const resolvedParams = await params;
  const tenant = getTenantConfig(resolvedParams.tenant);

  if (!tenant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <div className="container-page">
          <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-16">
            <span className="label text-accent mb-4 inline-block">Booking Engine</span>
            <h1 className="heading-section text-foreground mb-4">Plan Your Journey</h1>
            <p className="body-lg text-balance">
              Search curated experiences, luxury stays, and flights. Our team handles every detail.
            </p>
          </div>

          <BookingForm />

          <div className="mt-16 lg:mt-20 grid gap-8 lg:grid-cols-3">
            <Card className="glass-card text-center p-8">
              <CardHeader>
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mx-auto mb-4">
                  <Users className="w-8 h-8" aria-hidden="true" />
                </div>
                <CardTitle>Personal Travel Designer</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  A dedicated designer crafts your itinerary from start to finish, available 24/7 during your journey.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="glass-card text-center p-8">
              <CardHeader>
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mx-auto mb-4">
                  <Shield className="w-8 h-8" aria-hidden="true" />
                </div>
                <CardTitle>Price Match Guarantee</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Find the same experience for less? We&apos;ll match it and add a complimentary upgrade.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="glass-card text-center p-8">
              <CardHeader>
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mx-auto mb-4">
                  <Compass className="w-8 h-8" aria-hidden="true" />
                </div>
                <CardTitle>Seamless Logistics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Transfers, reservations, special requests - every detail coordinated before you depart.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <section className="mt-20 lg:mt-28 py-16 lg:py-20 bg-muted/30 rounded-3xl text-center" aria-labelledby="booking-cta-heading">
            <div className="container-narrow">
              <h2 id="booking-cta-heading" className="heading-section text-foreground mb-4">
                Prefer to Speak with a Designer?
              </h2>
              <p className="body-lg text-balance mb-8 max-w-xl mx-auto">
                Schedule a complimentary consultation and let us design your perfect journey together.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={`/${resolvedParams.tenant}/contact`}
                  className={buttonLinkClass("default", "px-10 py-4")}
                >
                  Schedule Consultation
                  <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                </Link>
                <Link
                  href={`/${resolvedParams.tenant}/explore`}
                  className={buttonLinkClass("secondary", "px-10 py-4")}
                >
                  Browse Experiences
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer tenant={tenant} currentTenantSlug={resolvedParams.tenant} />
    </div>
  );
}
