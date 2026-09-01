"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, ArrowRight } from "lucide-react";
import { type Destination } from "@/lib/tenant/config";

interface FeaturedDestinationsProps {
  destinations: Destination[];
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  currentTenantSlug?: string;
}

const easing = [0.4, 0, 0.2, 1] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easing },
  },
  hover: {
    y: -8,
    transition: { duration: 0.3, ease: easing },
  },
};

const defaultDestinations: Destination[] = [
  {
    id: "amalfi",
    name: "Amalfi Coast",
    description: "Cliffside villages cascading into azure Mediterranean waters",
    shortDescription: "Italy's most enchanting coastline",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80",
    country: "Italy",
    price: 4500,
    currency: "USD",
    duration: "7 nights",
    category: "Coastal Luxury",
    rating: 4.9,
    highlights: ["Private boat tours", "Michelin dining", "Lemon grove visits"],
    featured: true,
    order: 1,
  },
  {
    id: "kyoto",
    name: "Kyoto",
    description: "Ancient temples and serene gardens in Japan's cultural heart",
    shortDescription: "Timeless elegance in every season",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80",
    country: "Japan",
    price: 6200,
    currency: "USD",
    duration: "6 nights",
    category: "Cultural Journey",
    rating: 4.8,
    highlights: ["Tea ceremony", "Bamboo forest", "Temple stays"],
    featured: true,
    order: 2,
  },
  {
    id: "santorini",
    name: "Santorini",
    description: "Iconic white architecture and legendary sunsets over the caldera",
    shortDescription: "Aegean perfection",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=80",
    country: "Greece",
    price: 3800,
    currency: "USD",
    duration: "5 nights",
    category: "Island Escape",
    rating: 4.9,
    highlights: ["Sunset sailing", "Wine tasting", "Volcano hike"],
    featured: false,
    order: 3,
  },
  {
    id: "bora-bora",
    name: "Bora Bora",
    description: "Overwater bungalows above crystal-clear lagoons",
    shortDescription: "Paradise found in French Polynesia",
    image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80",
    country: "French Polynesia",
    price: 8900,
    currency: "USD",
    duration: "7 nights",
    category: "Ultimate Luxury",
    rating: 5.0,
    highlights: ["Shark feeding", "Lagoon spa", "Private motu dinner"],
    featured: true,
    order: 4,
  },
  {
    id: "maldives",
    name: "Maldives",
    description: "Pristine atolls with world-class marine life",
    shortDescription: "Indian Ocean sanctuary",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80",
    country: "Maldives",
    price: 7200,
    currency: "USD",
    duration: "6 nights",
    category: "Island Escape",
    rating: 4.9,
    highlights: ["Underwater dining", "Manta ray snorkeling", "Dolphin cruise"],
    featured: false,
    order: 5,
  },
  {
    id: "marrakech",
    name: "Marrakech",
    description: "Vibrant souks and palatial riads in the Red City",
    shortDescription: "Moroccan mystery and majesty",
    image: "https://images.unsplash.com/photo-1582718968968-7b3b2a1c7d9d?w=1200&q=80",
    country: "Morocco",
    price: 3200,
    currency: "USD",
    duration: "5 nights",
    category: "Cultural Journey",
    rating: 4.7,
    highlights: ["Desert camp", "Cooking class", "Hammam spa"],
    featured: false,
    order: 6,
  },
];

export function FeaturedDestinations({
  destinations = defaultDestinations,
  title = "Featured Destinations",
  subtitle = "Hand-selected properties and experiences for the discerning traveler",
  viewAllHref,
  viewAllLabel = "View All Destinations",
  currentTenantSlug = "",
}: FeaturedDestinationsProps) {
  const resolvedViewAllHref = viewAllHref || `/${currentTenantSlug}/explore`;
  const featuredDestinations = destinations.filter((d) => d.featured).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const otherDestinations = destinations.filter((d) => !d.featured).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const primaryDestination = featuredDestinations[0];
  const secondaryDestinations = [...featuredDestinations.slice(1), ...otherDestinations].slice(0, 3);

  return (
    <section className="py-20 lg:py-28" aria-labelledby="destinations-heading">
      <div className="container-page">
        <motion.div className="max-w-3xl mb-16 lg:mb-20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="label text-accent mb-4 inline-block">Curated Collection</span>
          <h2 id="destinations-heading" className="heading-section text-foreground mb-4">
            {title}
          </h2>
          <p className="body-lg text-balance">{subtitle}</p>
        </motion.div>

        {primaryDestination && (
          <motion.div
            className="mb-12 lg:mb-16"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Link
              href={`${resolvedViewAllHref}/${primaryDestination.id}`}
              className="group block"
              aria-label={`Explore ${primaryDestination.name}`}
            >
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                className="relative aspect-[16/9] lg:aspect-[2/1] rounded-2xl overflow-hidden elegant-shadow"
              >
                <Image
                  src={primaryDestination.image}
                  alt=""
                  fill
                  priority
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  quality={90}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/60 to-transparent" />
                <div className="absolute inset-0 p-8 lg:p-12 flex flex-col justify-end">
                  <div className="max-w-xl">
                    <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
                      <MapPin className="w-4 h-4" aria-hidden="true" />
                      <span>{primaryDestination.country}</span>
                      {primaryDestination.category && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{primaryDestination.category}</span>
                        </>
                      )}
                    </div>
                    <h3 className="heading-section text-white mb-3 group-hover:text-accent transition-colors">
                      {primaryDestination.name}
                    </h3>
                    <p className="text-white/90 text-lg mb-6 max-w-md">{primaryDestination.description}</p>
                    <div className="flex flex-wrap items-center gap-6 mb-6">
                      {primaryDestination.rating && (
                        <div className="flex items-center gap-1 text-white/90">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                          <span className="font-medium">{primaryDestination.rating}</span>
                        </div>
                      )}
                      {primaryDestination.duration && (
                        <div className="flex items-center gap-1 text-white/80">
                          <span className="text-sm">{primaryDestination.duration}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-white group-hover:gap-3 transition-all">
                      <span className="text-lg font-medium">{primaryDestination.currency || "$"}{primaryDestination.price?.toLocaleString()}</span>
                      <span className="text-white/70">per person</span>
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        )}

        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {secondaryDestinations.map((destination, index) => (
            <motion.div key={destination.id} variants={cardVariants} style={{ transitionDelay: `${index * 100}ms` }}>
              <Link
                href={`${resolvedViewAllHref}/${destination.id}`}
                className="group block glass-card overflow-hidden aspect-[4/3] elegant-shadow-hover"
                aria-label={`Explore ${destination.name}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={destination.image}
                    alt=""
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={85}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
                    <MapPin className="w-4 h-4" aria-hidden="true" />
                    <span>{destination.country}</span>
                    {destination.category && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{destination.category}</span>
                      </>
                    )}
                  </div>
                  <h3 className="heading-card text-white mb-2 group-hover:text-accent transition-colors">
                    {destination.name}
                  </h3>
                  <p className="text-white/90 text-sm mb-4 line-clamp-2">{destination.shortDescription || destination.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/90">
                      {destination.rating && (
                        <>
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                          <span className="font-medium">{destination.rating}</span>
                        </>
                      )}
                      {destination.duration && <span className="text-sm">{destination.duration}</span>}
                    </div>
                    <div className="flex items-center gap-1 text-white group-hover:gap-2 transition-all">
                      <span className="font-medium">{destination.currency || "$"}{destination.price?.toLocaleString()}</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {resolvedViewAllHref && (
          <motion.div
            className="mt-12 lg:mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Link
              href={resolvedViewAllHref}
              className="btn-secondary inline-flex items-center gap-2 px-8 py-3.5 text-base"
            >
              {viewAllLabel}
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}