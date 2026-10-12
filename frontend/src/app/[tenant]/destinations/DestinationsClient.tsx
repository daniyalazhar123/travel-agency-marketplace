"use client";

/**
 * Client half of /[tenant]/destinations.
 *
 * Owns every Framer Motion primitive (FadeUp, StaggerGrid, motion.div
 * card wrappers) so the page stays a Server Component that fetches data
 * and passes serializable props.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";
import {
  DestinationCard,
  type DestinationCardData,
} from "@/components/travel/destinations/DestinationCard";
import { FadeUp, StaggerGrid, fadeUpVariants } from "@/lib/motion-primitives";
import { isStripeBookableId } from "@/lib/tenant/bookable";

export interface PublicDestination extends DestinationCardData {
  featured?: boolean;
  location?: { city?: string; country?: string };
}

interface DestinationsClientProps {
  tenantSlug: string;
  destinations: PublicDestination[];
  categories: string[];
  selectedCategory: string | undefined;
  featuredDestinations: PublicDestination[];
  isLive: boolean;
}

export function DestinationsClient({
  tenantSlug,
  destinations,
  categories,
  selectedCategory,
  featuredDestinations,
  isLive,
}: DestinationsClientProps) {
  const filteredDestinations = selectedCategory
    ? destinations.filter((d) => d.category === selectedCategory)
    : destinations;

  return (
    <>
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
            href={`/${tenantSlug}/destinations`}
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
              href={`/${tenantSlug}/destinations`}
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
                tenant={tenantSlug}
                isBookable={isStripeBookableId(destination.id, destination.price)}
              />
            </motion.div>
          ))
        )}
      </StaggerGrid>

      {filteredDestinations.length > 0 && !selectedCategory && featuredDestinations.length > 0 && (
        <div className="mt-16 lg:mt-20 text-center">
          <Link
            href={`/${tenantSlug}/explore`}
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
    </>
  );
}
