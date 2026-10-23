import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenantConfig } from "@/lib/tenant/config";
import { Footer } from "@/components/travel/footer/Footer";
import { DestinationCard, type DestinationCardData } from "@/components/travel/destinations/DestinationCard";
import { isStripeBookableId } from "@/lib/tenant/bookable";
import { StaggerGrid, FadeUp, fadeUpVariants } from "@/lib/motion-primitives";
import { motion } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";

interface TenantPageProps {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ category?: string; featured?: string }>;
}

interface PublicDestination extends DestinationCardData {
  featured?: boolean;
  location?: { city?: string; country?: string };
}

export async function generateMetadata({ params }: TenantPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const tenant = getTenantConfig(resolvedParams.tenant);
  if (!tenant) return { title: "Tenant Not Found" };
  return {
    title: `Destinations - ${tenant.name}`,
    description: `Explore our curated collection of extraordinary destinations worldwide. ${tenant.description}`,
  };
}

/**
 * Fetch live destinations from the backend API.
 * Returns null on any failure so the caller can fall back to config data.
 */
async function fetchApiDestinations(tenantId: string): Promise<PublicDestination[] | null> {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "https://8d037e55-ee42-46aa-9371-a36de024c7dd-00-2m01srlp9rho5.pike.replit.dev";
  try {
    const res = await fetch(`${base}/destinations?tenant_id=${encodeURIComponent(tenantId)}`, {
      next: { revalidate: 60 }, // ISR: refresh every minute
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{
      id: string;
      title: string;
      description: string | null;
      price: number | null;
      currency: string;
      image_url: string | null;
    }>;
    return rows.map((r) => ({
      id: r.id,
      name: r.title,
      description: r.description ?? "",
      image: r.image_url ?? "",
      price: r.price ?? undefined,
      currency: r.currency,
    }));
  } catch {
    return null;
  }
}

export default async function TenantDestinationsPage({ params, searchParams }: TenantPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const tenant = getTenantConfig(resolvedParams.tenant);
  if (!tenant) notFound();

  // 1) Live API data first; 2) tenant config fallback when backend is down
  const apiDestinations = await fetchApiDestinations(resolvedParams.tenant);
  const configDestinations: PublicDestination[] = (tenant.destinations ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    image: d.image,
    price: d.price,
    currency: d.currency,
    category: d.category,
    rating: d.rating,
    featured: d.featured,
    location: d.location ? { city: d.location.city, country: d.location.country } : undefined,
  }));
  const destinations = apiDestinations ?? configDestinations;
  const isLive = apiDestinations !== null;

  const categories = [...new Set(destinations.map((d) => d.category).filter(Boolean))] as string[];
  const selectedCategory = resolvedSearchParams.category;
  const featuredDestinations = destinations.filter((d) => d.featured);

  const filteredDestinations = selectedCategory
    ? destinations.filter((d) => d.category === selectedCategory)
    : destinations;

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <div className="container-page">
          <FadeUp className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
            <span className="label text-accent mb-4 inline-block">Our World</span>
            <h1 className="heading-section text-foreground mb-4">Extraordinary Destinations</h1>
            <p className="body-lg text-balance">
              Hand-selected locations that define luxury travel. Each destination offers
              unique experiences, exceptional accommodations, and unforgettable moments.
            </p>
          </FadeUp>

          {categories.length > 0 && (
            <div className="mb-10">
              <Link
                href={`/${resolvedParams.tenant}/destinations`}
                className="text-sm text-accent hover:underline"
              >
                Browse all destinations
              </Link>
            </div>
          )}

          <StaggerGrid className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {filteredDestinations.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" aria-hidden="true" />
                <h3 className="heading-card text-foreground mb-2">No destinations found</h3>
                <p className="text-muted-foreground">
                  {selectedCategory
                    ? `No destinations in the "${selectedCategory}" category.`
                    : "No destinations configured for this agency yet."}
                </p>
                <Link
                  href={`/${resolvedParams.tenant}/destinations`}
                  className="btn-secondary inline-flex items-center gap-2 mt-4"
                >
                  View All Destinations
                </Link>
              </div>
            ) : (
              filteredDestinations.map((destination) => (
                <motion.div key={destination.id} variants={fadeUpVariants}>
                  <DestinationCard
                    destination={{
                      id: destination.id,
                      name: destination.name,
                      description: destination.description,
                      image: destination.image,
                      price: destination.price,
                      currency: destination.currency,
                      category: destination.category,
                      rating: destination.rating,
                      country: destination.location?.country,
                    }}
                    tenant={resolvedParams.tenant}
                    isBookable={isStripeBookableId(destination.id, destination.price)}
                  />
                </motion.div>
              ))
            )}
          </StaggerGrid>

          {filteredDestinations.length > 0 && !selectedCategory && featuredDestinations.length > 0 && (
            <div className="mt-16 lg:mt-20 text-center">
              <Link
                href={`/${resolvedParams.tenant}/explore`}
                className="btn-secondary inline-flex items-center gap-2 px-10 py-4 text-lg"
              >
                View All on Explore Page
                <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
              </Link>
            </div>
          )}

          {/* Data-source indicator (transparency for the demo) */}
          <p className="mt-12 text-center text-xs text-muted-foreground/60">
            {isLive
              ? "Live data from agency database"
              : "Backend offline — showing starter collection"}
          </p>
        </div>
      </main>
      <Footer tenant={tenant} currentTenantSlug={resolvedParams.tenant} />
    </div>
  );
}
