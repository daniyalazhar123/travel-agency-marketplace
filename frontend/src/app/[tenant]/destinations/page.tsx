import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenantConfig } from "@/lib/tenant/config";
import { Footer } from "@/components/travel/footer/Footer";
import { MapPin, Star, ArrowRight } from "lucide-react";
import Link from "next/link";

interface TenantPageProps {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ category?: string; featured?: string }>;
}

interface PublicDestination {
  id: string;
  name: string;
  description: string;
  image: string;
  price?: number;
  currency?: string;
  category?: string;
  rating?: number;
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
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://127.0.0.1:8000";
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

  const formatPrice = (price?: number, currency = "USD") => {
    if (!price) return "Contact for pricing";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    } catch {
      return `${currency} ${price.toLocaleString()}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <div className="container-page">
          <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
            <span className="label text-accent mb-4 inline-block">Our World</span>
            <h1 className="heading-section text-foreground mb-4">Extraordinary Destinations</h1>
            <p className="body-lg text-balance">
              Hand-selected locations that define luxury travel. Each destination offers
              unique experiences, exceptional accommodations, and unforgettable moments.
            </p>
          </div>

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

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
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
                <div
                  key={destination.id}
                  className="group glass-card overflow-hidden aspect-[4/3] elegant-shadow-hover flex flex-col"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {destination.image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- remote admin-provided URLs
                      <img
                        src={destination.image}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 flex items-center justify-center">
                        <MapPin className="w-10 h-10 text-muted-foreground/40" aria-hidden="true" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" aria-hidden="true" />
                    {destination.category && (
                      <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1.5 rounded-full bg-white/90 text-primary text-xs font-medium backdrop-blur-sm">
                          {destination.category}
                        </span>
                      </div>
                    )}
                    {destination.rating && (
                      <div className="absolute bottom-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/90 text-primary text-xs font-medium backdrop-blur-sm">
                        <Star className="w-3 h-3 fill-current text-accent" aria-hidden="true" />
                        <span>{destination.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="heading-card text-foreground">{destination.name}</h3>
                      {destination.price != null && (
                        <span className="text-accent font-display font-medium text-lg whitespace-nowrap">
                          {formatPrice(destination.price, destination.currency)}
                        </span>
                      )}
                    </div>
                    {destination.location?.country && (
                      <p className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                        <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                        {destination.location.city ? `${destination.location.city}, ` : ""}{destination.location.country}
                      </p>
                    )}
                    <p className="text-muted-foreground text-sm mb-4 flex-1 line-clamp-2">{destination.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <Link
                        href={`/${resolvedParams.tenant}/booking`}
                        className="text-sm font-medium text-foreground hover:text-accent transition-colors"
                      >
                        Plan a Journey
                      </Link>
                      <ArrowRight className="w-4 h-4 text-accent group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

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
