import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantConfig, type Destination as TenantDestination } from "@/lib/tenant/config";
import { isUuidDestinationId } from "@/lib/tenant/bookable";
import { Footer } from "@/components/travel/footer/Footer";
import { DestinationCard, type DestinationCardData } from "@/components/travel/destinations/DestinationCard";
import { BookAndPayPanel } from "@/components/travel/destinations/BookAndPayPanel";
import { MapPin, Star, Calendar, ArrowRight, ShieldCheck } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiDestination {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  image_url: string | null;
}

interface ResolvedDestination extends DestinationCardData {
  isLive: boolean;
  highlights?: string[];
  duration?: string;
}

interface RelatedDestination extends DestinationCardData {
  isBookable: boolean;
}

// ---------------------------------------------------------------------------
// Data fetching (list endpoint is public; resolved by id, ISR-cached 60s)
// ---------------------------------------------------------------------------

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "https://8d037e55-ee42-46aa-9371-a36de024c7dd-00-2m01srlp9rho5.pike.replit.dev";

async function fetchApiDestinations(tenantId: string): Promise<ApiDestination[] | null> {
  try {
    const res = await fetch(
      `${API_BASE}/destinations?tenant_id=${encodeURIComponent(tenantId)}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    return (await res.json()) as ApiDestination[];
  } catch {
    return null; // backend down -> config fallback
  }
}

/** Resolve a destination by id: live DB first, tenant config fallback second. */
async function resolveDestination(
  tenantSlug: string,
  id: string,
  configDests: TenantDestination[] | undefined
): Promise<ResolvedDestination | null> {
  // Live path: any id that exists in the backend catalog (UUID-keyed).
  const apiRows = await fetchApiDestinations(tenantSlug);
  if (apiRows) {
    const hit = apiRows.find((r) => r.id === id);
    if (hit) {
      return {
        id: hit.id,
        name: hit.title,
        description: hit.description ?? "A hand-curated journey crafted by our travel designers.",
        image: hit.image_url ?? "",
        price: hit.price ?? undefined,
        currency: hit.currency,
        isLive: true,
      };
    }
    // Valid live catalog, id not in it -> genuine 404 (do NOT fall back:
    // a slug could never match a UUID path anyway).
    if (isUuidDestinationId(id)) return null;
  }

  // Config fallback (backend down or slug id)
  const fb = configDests?.find((d) => d.id === id);
  if (!fb) return null;
  return {
    id: fb.id,
    name: fb.name,
    description: fb.description,
    image: fb.image,
    price: fb.price,
    currency: fb.currency,
    category: fb.category,
    rating: fb.rating,
    country: fb.country ?? fb.location?.country,
    highlights: fb.highlights,
    duration: fb.duration,
    isLive: false,
  };
}

/** Up to 3 related destinations, same source as the main one. */
async function fetchRelated(
  tenantSlug: string,
  currentId: string,
  configDests: TenantDestination[] | undefined,
  isLive: boolean
): Promise<RelatedDestination[]> {
  if (isLive) {
    const rows = await fetchApiDestinations(tenantSlug);
    if (rows) {
      return rows
        .filter((r) => r.id !== currentId && r.price != null)
        .slice(0, 3)
        .map((r) => ({
          id: r.id,
          name: r.title,
          description: r.description ?? "",
          image: r.image_url ?? "",
          price: r.price ?? undefined,
          currency: r.currency,
          isBookable: true, // UUID id + priced row
        }));
    }
    return []; // live id with backend down -> no honest related data
  }
  const fb = configDests ?? [];
  return fb
    .filter((d) => d.id !== currentId)
    .slice(0, 3)
    .map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      image: d.image,
      price: d.price,
      currency: d.currency,
      category: d.category,
      rating: d.rating,
      country: d.country ?? d.location?.country,
      isBookable: false, // slug ids can't hit the Stripe proxy
    }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number, currency = "USD") {
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
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface DetailPageProps {
  params: Promise<{ tenant: string; id: string }>;
}

export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const { tenant: tenantSlug, id } = await params;
  const tenant = getTenantConfig(tenantSlug);
  if (!tenant) return { title: "Destination Not Found" };

  const dest = await resolveDestination(tenantSlug, id, tenant.destinations);
  if (!dest) return { title: "Destination Not Found" };

  return {
    title: `${dest.name} - ${tenant.name}`,
    description:
      dest.description.length > 155
        ? `${dest.description.slice(0, 152)}...`
        : dest.description,
  };
}

export default async function DestinationDetailPage({ params }: DetailPageProps) {
  const { tenant: tenantSlug, id } = await params;
  const tenant = getTenantConfig(tenantSlug);
  if (!tenant) notFound();

  const dest = await resolveDestination(tenantSlug, id, tenant.destinations);
  if (!dest) notFound();

  // Book & Pay is only possible for live, priced, UUID-keyed catalog rows:
  // the Stripe proxy resolves the amount server-side from the DB by id.
  const isBookable = dest.isLive && typeof dest.price === "number" && dest.price > 0;
  const related = await fetchRelated(tenantSlug, id, tenant.destinations, dest.isLive);

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        {/* ---------- HERO ---------- */}
        <div className="relative aspect-[16/9] lg:aspect-[2.35/1] overflow-hidden elegant-shadow">
          {dest.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote admin-provided URL
            <img src={dest.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20" />
          )}
          <div
            className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-primary/10"
            aria-hidden="true"
          />
          <div className="relative container-page h-full flex items-end pb-8 lg:pb-12">
            <div className="max-w-3xl">
              {dest.category && (
                <span className="label text-accent mb-3 inline-block bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  {dest.category}
                </span>
              )}
              <h1 className="heading-hero text-white mb-3">{dest.name}</h1>
              <div className="flex flex-wrap items-center gap-5 text-white/90 text-sm">
                {dest.country && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" aria-hidden="true" />
                    {dest.country}
                  </span>
                )}
                {dest.duration && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" aria-hidden="true" />
                    {dest.duration}
                  </span>
                )}
                {dest.rating != null && (
                  <span className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-current text-accent" aria-hidden="true" />
                    {dest.rating.toFixed(1)}
                  </span>
                )}
                {typeof dest.price === "number" && (
                  <span className="font-display text-lg font-medium text-white">
                    {formatPrice(dest.price, dest.currency)}{" "}
                    <span className="text-white/70 text-sm font-body">per person</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container-page mt-12 lg:mt-16">
          {/* ---------- BODY + BOOKING SIDEBAR ---------- */}
          <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
            <div>
              <span className="label text-accent mb-4 inline-block">The Journey</span>
              <h2 className="heading-section text-foreground mb-6">About this destination</h2>
              <p className="body-lg text-balance whitespace-pre-line">{dest.description}</p>

              {dest.highlights && dest.highlights.length > 0 && (
                <div className="mt-12">
                  <h3 className="heading-card text-foreground mb-4">Signature Experiences</h3>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {dest.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2.5 text-sm text-foreground">
                        <ShieldCheck className="w-4 h-4 mt-0.5 text-accent shrink-0" aria-hidden="true" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Plan a Journey — secondary path for custom inquiries */}
              <div className="mt-12 p-6 rounded-xl border border-border bg-muted/20">
                <h3 className="heading-card text-foreground mb-2">Want something custom?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Every journey can be tailored — dates, group size, upgrades, multi-destination
                  itineraries. Tell us what you dream of and a designer will craft a proposal
                  within 24 hours.
                </p>
                <Link
                  href={`/${tenantSlug}/booking`}
                  className="btn-secondary inline-flex items-center gap-2 px-6 py-3"
                >
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  Plan a Journey
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* ---------- STICKY BOOK & PAY SIDEBAR ---------- */}
            <aside aria-label="Booking options" className="lg:sticky lg:top-28 self-start">
              {isBookable && typeof dest.price === "number" ? (
                <BookAndPayPanel
                  tenant={tenantSlug}
                  destinationId={dest.id}
                  destinationName={dest.name}
                  price={dest.price}
                  currency={dest.currency ?? "USD"}
                />
              ) : (
                <div className="glass-card p-8">
                  <h3 className="heading-card text-foreground mb-2">
                    {typeof dest.price === "number" ? "Reserve your journey" : "Priced on request"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {typeof dest.price === "number"
                      ? "Instant online checkout isn't available for this listing yet — send an inquiry and we'll confirm availability within 24 hours."
                      : "This journey is tailored to you. Tell us your dates and preferences; a travel designer will send a personalized proposal within 24 hours."}
                  </p>
                  <Link
                    href={`/${tenantSlug}/booking`}
                    className="btn-primary w-full inline-flex items-center justify-center gap-2 px-8 py-4"
                  >
                    <Calendar className="w-5 h-5" aria-hidden="true" />
                    Plan a Journey
                  </Link>
                </div>
              )}

              <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                Payments are processed securely by Stripe. We never see or store your card details.
              </p>
            </aside>
          </div>

          {/* ---------- RELATED DESTINATIONS ---------- */}
          {related.length > 0 && (
            <section aria-labelledby="related-heading" className="mt-20 lg:mt-28">
              <div className="mb-8">
                <span className="label text-accent mb-3 inline-block">Keep Exploring</span>
                <h2 id="related-heading" className="heading-section text-foreground">
                  Other journeys you may love
                </h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((d) => (
                  <DestinationCard
                    key={d.id}
                    destination={d}
                    tenant={tenantSlug}
                    isBookable={d.isBookable}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Data-source indicator (transparency for the demo) */}
          <p className="mt-12 text-center text-xs text-muted-foreground/60">
            {dest.isLive ? "Live data from agency database" : "Backend offline — showing starter collection"}
          </p>
        </div>
      </main>
      <Footer tenant={tenant} currentTenantSlug={tenantSlug} />
    </div>
  );
}
