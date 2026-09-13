"use client";

/**
 * Clickable destination card.
 *
 * The ENTIRE card (image, title, price) links to /[tenant]/destinations/[id].
 * An invisible full-card overlay Link (z-10) makes the whole surface one
 * click target; real nested links (title, price, footer CTAs) sit above it
 * (z-20) so they remain individually clickable and keyboard-accessible.
 *
 * `isBookable` (live catalog row with UUID id + price) controls the footer
 * CTA: "Book & Pay Instantly" hint (links to the detail page where the
 * Stripe checkout panel lives) vs. inquiry-only "Plan a Journey".
 */

import Link from "next/link";
import { CreditCard, MapPin, Star, ArrowRight } from "lucide-react";
import { isStripeBookableId } from "@/lib/tenant/bookable";

export interface DestinationCardData {
  id: string;
  name: string;
  description: string;
  image: string;
  price?: number;
  currency?: string;
  category?: string;
  rating?: number;
  country?: string;
}

interface DestinationCardProps {
  destination: DestinationCardData;
  tenant: string;
  /** Live DB row (UUID id + priced) -> Stripe checkout available on detail page. */
  isBookable: boolean;
}

// Re-export so client consumers can import either way — implementation lives
// in the server-safe lib module.
export { isStripeBookableId };

export function DestinationCard({ destination, tenant, isBookable }: DestinationCardProps) {
  const detailHref = `/${tenant}/destinations/${destination.id}`;
  const bookingHref = `/${tenant}/booking`;

  const formatPrice = (price: number, currency = "USD") => {
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
    <div className="group relative glass-card overflow-hidden elegant-shadow-hover flex flex-col cursor-pointer card-gradient-lift">
      {/* Whole-card click target -> detail page (overlay z-10; footer CTAs stay at z-20) */}
      <Link
        href={detailHref}
        className="absolute inset-0 z-10"
        aria-label={`View details for ${destination.name}${destination.price != null ? `, from ${formatPrice(destination.price, destination.currency)}` : ""}`}
      />

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
        {destination.rating != null && (
          <div className="absolute bottom-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/90 text-primary text-xs font-medium backdrop-blur-sm">
            <Star className="w-3 h-3 fill-current text-accent" aria-hidden="true" />
            <span>{destination.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="heading-card text-foreground">
            <Link href={detailHref} className="hover:text-accent transition-colors">
              {destination.name}
            </Link>
          </h3>
          {destination.price != null && (
            <Link
              href={detailHref}
              className="price-badge-animate relative z-20 text-accent font-display font-medium text-lg whitespace-nowrap hover:underline"
              aria-label={`View details for ${destination.name}, from ${formatPrice(destination.price, destination.currency)}`}
            >
              {formatPrice(destination.price, destination.currency)}
            </Link>
          )}
        </div>
        {destination.country && (
          <p className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            {destination.country}
          </p>
        )}
        <p className="text-muted-foreground text-sm mb-4 flex-1 line-clamp-2">{destination.description}</p>

        {/* Footer CTAs sit above the overlay link (z-20) so they remain clickable */}
        <div className="relative z-20 flex items-center justify-between pt-4 border-t border-border/50">
          {isBookable ? (
            <Link
              href={detailHref}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
            >
              <CreditCard className="w-4 h-4" aria-hidden="true" />
              Book &amp; Pay Instantly
            </Link>
          ) : (
            <Link
              href={bookingHref}
              className="text-sm font-medium text-foreground hover:text-accent transition-colors"
            >
              Plan a Journey
            </Link>
          )}
          <ArrowRight className="w-4 h-4 text-accent group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
