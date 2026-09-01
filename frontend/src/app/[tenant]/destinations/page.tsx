import { Metadata } from "next";
import { getTenantConfig } from "@/lib/tenant/config";
import { Footer } from "@/components/travel/footer/Footer";
import { MapPin, Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { FilterBar } from "@/components/travel/filter/FilterBar";

interface TenantPageProps {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ category?: string; featured?: string }>;
}

export async function generateMetadata({ params }: TenantPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const tenant = getTenantConfig(resolvedParams.tenant);

  if (!tenant) {
    return { title: "Tenant Not Found" };
  }

  return {
    title: `Destinations - ${tenant.name}`,
    description: `Explore our curated collection of extraordinary destinations worldwide. ${tenant.description}`,
  };
}

export default async function TenantDestinationsPage({ params, searchParams }: TenantPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const tenant = getTenantConfig(resolvedParams.tenant);

  if (!tenant) {
    return null;
  }

  const destinations = tenant.destinations ?? [];
  const featuredDestinations = destinations.filter((d) => d.featured);
  const categories = [...new Set(destinations.map((d) => d.category).filter(Boolean))] as string[];
  const selectedCategory = resolvedSearchParams.category;

  const filteredDestinations = selectedCategory
    ? destinations.filter((d) => d.category === selectedCategory)
    : destinations;

  const formatPrice = (price?: number, currency = "USD") => {
    if (!price) return "Contact for pricing";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
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
            <FilterBar
              options={categories.map((c) => ({ label: c, value: c }))}
              selectedValue={selectedCategory ?? null}
              basePath={`/${resolvedParams.tenant}/destinations`}
              label="Filter destinations by category"
            />
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {filteredDestinations.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" aria-hidden="true" />
                <h3 className="heading-card text-foreground mb-2">No destinations found</h3>
                <p className="text-muted-foreground">
                  {selectedCategory
                    ? `No destinations in the "${selectedCategory}" category.`
                    : "No destinations configured for this agency."}
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
                <Link
                  key={destination.id}
                  href={`/${resolvedParams.tenant}/destinations/${destination.id}`}
                  className="group glass-card overflow-hidden aspect-[4/3] elegant-shadow-hover flex flex-col"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={destination.image}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" aria-hidden="true" />
                    {destination.featured && (
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/90 text-on-accent text-xs font-medium">
                          <Star className="w-3 h-3" aria-hidden="true" />
                          Featured
                        </span>
                      </div>
                    )}
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
                      <h3 className="heading-card text-foreground group-hover:text-accent transition-colors">
                        {destination.name}
                      </h3>
                      {destination.price && (
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
                    <p className="text-muted-foreground text-sm mb-4 flex-1 line-clamp-2">{destination.shortDescription || destination.description}</p>
                    {destination.duration && (
                      <p className="text-sm text-foreground/70 mb-4">
                        <span className="font-medium">Duration: </span>{destination.duration}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <span className="text-sm font-medium text-foreground">Explore</span>
                      <ArrowRight className="w-4 h-4 text-accent group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                    </div>
                  </div>
                </Link>
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
        </div>
      </main>
      <Footer tenant={tenant} currentTenantSlug={resolvedParams.tenant} />
    </div>
  );
}
