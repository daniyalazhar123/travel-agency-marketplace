"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Clock, Users, MapPin, ArrowRight, Sparkles, Shield, Heart, Star } from "lucide-react";
import { type Experience } from "@/lib/tenant/config";

interface CuratedExperiencesProps {
  experiences: Experience[];
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
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easing },
  },
  hover: {
    y: -4,
    transition: { duration: 0.3, ease: easing },
  },
};

const categoryIcons: Record<string, React.ReactNode> = {
  "Private Escapes": <Sparkles className="w-5 h-5" aria-hidden="true" />,
  "Cultural Journeys": <Heart className="w-5 h-5" aria-hidden="true" />,
  "Island Retreats": <Shield className="w-5 h-5" aria-hidden="true" />,
  "Adventure": <Star className="w-5 h-5" aria-hidden="true" />,
  "Wellness": <Heart className="w-5 h-5" aria-hidden="true" />,
  "Luxury Stays": <Sparkles className="w-5 h-5" aria-hidden="true" />,
  default: <Sparkles className="w-5 h-5" aria-hidden="true" />,
};

const difficultyColors = {
  easy: "bg-green-100 text-green-700",
  moderate: "bg-amber-100 text-amber-700",
  challenging: "bg-red-100 text-red-700",
};

const defaultExperiences: Experience[] = [
  {
    id: "private-yacht-amalfi",
    name: "Private Yacht Charter: Amalfi Coast",
    description: "Sail the stunning Amalfi coastline aboard a luxury yacht with private chef and sommelier. Visit hidden coves, dine at waterfront Michelin restaurants, and sleep under the stars.",
    shortDescription: "Exclusive Mediterranean sailing experience",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
    category: "Private Escapes",
    duration: "Full day",
    price: 3500,
    currency: "USD",
    groupSize: "Up to 8 guests",
    difficulty: "easy",
    includes: ["Private yacht & crew", "Gourmet meals", "Wine pairings", "Snorkeling gear", "Hotel transfers"],
    location: { country: "Italy", city: "Amalfi" },
    featured: true,
    order: 1,
  },
  {
    id: "kyoto-tea-ceremony",
    name: "Private Tea Ceremony with Geisha",
    description: "Experience an authentic tea ceremony in a historic Kyoto machiya with a geisha. Learn the ancient rituals of matcha preparation and seasonal kaiseki cuisine.",
    shortDescription: "Intimate cultural immersion in Kyoto",
    image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80",
    category: "Cultural Journeys",
    duration: "3 hours",
    price: 850,
    currency: "USD",
    groupSize: "Up to 4 guests",
    difficulty: "easy",
    includes: ["Private tea ceremony", "Kaiseki tasting", "Geisha performance", "Historic venue", "Translation"],
    location: { country: "Japan", city: "Kyoto" },
    featured: true,
    order: 2,
  },
  {
    id: "maldives-underwater-dining",
    name: "Underwater Dining Experience",
    description: "Dine 5 meters beneath the Indian Ocean in an all-glass underwater restaurant. Watch manta rays and sharks glide past while enjoying a multi-course tasting menu.",
    shortDescription: "Dining surrounded by marine life",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
    category: "Island Retreats",
    duration: "2.5 hours",
    price: 650,
    currency: "USD",
    groupSize: "Up to 2 guests",
    difficulty: "easy",
    includes: ["Underwater restaurant", "Tasting menu", "Wine pairing", "Marine biologist guide", "Seaplane transfer"],
    location: { country: "Maldives" },
    featured: false,
    order: 3,
  },
  {
    id: "patagonia-trekking",
    name: "Patagonia Luxury Trekking",
    description: "Explore Torres del Paine with expert guides, staying in exclusive eco-domes with panoramic glacier views. Helicopter access to remote trails included.",
    shortDescription: "Adventure meets luxury in Patagonia",
    image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80",
    category: "Adventure",
    duration: "5 days / 4 nights",
    price: 8900,
    currency: "USD",
    groupSize: "Up to 6 guests",
    difficulty: "moderate",
    includes: ["Eco-dome accommodation", "Helicopter transfers", "Expert guides", "All meals", "Park permits", "Equipment"],
    location: { country: "Chile", city: "Torres del Paine" },
    featured: false,
    order: 4,
  },
  {
    id: "bali-wellness-retreat",
    name: "Balinese Wellness Sanctuary",
    description: "A transformative wellness journey in Ubud's jungles. Daily yoga, traditional healing, spa treatments, and plant-based cuisine in a private villa setting.",
    shortDescription: "Holistic renewal in Bali",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
    category: "Wellness",
    duration: "7 days / 6 nights",
    price: 4200,
    currency: "USD",
    groupSize: "Solo or couple",
    difficulty: "easy",
    includes: ["Private villa", "Daily yoga & meditation", "Spa treatments", "Healing sessions", "Organic meals", "Airport transfers"],
    location: { country: "Indonesia", city: "Ubud" },
    featured: true,
    order: 5,
  },
  {
    id: "safari-botswana",
    name: "Okavango Delta Safari",
    description: "Private mobile safari through the Okavango Delta. Luxury tented camps, expert trackers, mokoro canoe excursions, and night drives in one of Africa's last true wildernesses.",
    shortDescription: "Ultimate African safari experience",
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&q=80",
    category: "Adventure",
    duration: "8 days / 7 nights",
    price: 12500,
    currency: "USD",
    groupSize: "Up to 4 guests",
    difficulty: "moderate",
    includes: ["Luxury tented camps", "Private guide & vehicle", "Mokoro excursions", "All meals & drinks", "Park fees", "Internal flights"],
    location: { country: "Botswana", city: "Okavango Delta" },
    featured: false,
    order: 6,
  },
];

export function CuratedExperiences({
  experiences = defaultExperiences,
  title = "Curated Experiences",
  subtitle = "Extraordinary moments crafted for those who seek the exceptional",
  viewAllHref,
  viewAllLabel = "View All Experiences",
  currentTenantSlug = "",
}: CuratedExperiencesProps) {
  const resolvedViewAllHref = viewAllHref || `/${currentTenantSlug}/experiences`;
  const featuredExperiences = experiences.filter((e) => e.featured).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const otherExperiences = experiences.filter((e) => !e.featured).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const primaryExperience = featuredExperiences[0];
  const secondaryExperiences = [...featuredExperiences.slice(1), ...otherExperiences].slice(0, 2);

  return (
    <section className="py-20 lg:py-28 bg-muted/30" aria-labelledby="experiences-heading">
      <div className="container-page">
        <motion.div className="max-w-3xl mb-16 lg:mb-20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="label text-accent mb-4 inline-block">Extraordinary Moments</span>
          <h2 id="experiences-heading" className="heading-section text-foreground mb-4">
            {title}
          </h2>
          <p className="body-lg text-balance">{subtitle}</p>
        </motion.div>

        {primaryExperience && (
          <motion.div
            className="mb-16 lg:mb-20"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Link
              href={resolvedViewAllHref}
              className="group block"
              aria-label={`Explore ${primaryExperience.name}`}
            >
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                className="relative grid lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden elegant-shadow glass-card"
              >
                <div className="relative aspect-square lg:aspect-auto min-h-[400px] overflow-hidden">
                  <Image
                    src={primaryExperience.image}
                    alt=""
                    fill
                    priority
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    quality={90}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/40 to-transparent" />
                  <div className="absolute inset-0 p-8 lg:p-12 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 text-white/90 mb-6">
                        {categoryIcons[primaryExperience.category] || categoryIcons.default}
                        <span className="text-sm font-medium uppercase tracking-wide">{primaryExperience.category}</span>
                      </div>
                    </div>
                    <div className="max-w-md">
                      <h3 className="heading-section text-white mb-4 group-hover:text-accent-light transition-colors">
                        {primaryExperience.name}
                      </h3>
                      <p className="text-white/90 text-lg mb-6">{primaryExperience.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm mb-6">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" aria-hidden="true" />
                          <span>{primaryExperience.duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" aria-hidden="true" />
                          <span>{primaryExperience.groupSize}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" aria-hidden="true" />
                          <span>{primaryExperience.location?.city ?? primaryExperience.location?.country ?? ""}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyColors[primaryExperience.difficulty || "easy"]}`}>
                          {primaryExperience.difficulty ? primaryExperience.difficulty.charAt(0).toUpperCase() + primaryExperience.difficulty.slice(1) : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-white group-hover:gap-3 transition-all">
                        <span className="text-2xl font-medium">{primaryExperience.currency || "$"}{primaryExperience.price?.toLocaleString()}</span>
                        <span className="text-white/70">per person</span>
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center bg-card">
                  <h4 className="label text-accent mb-4">What's Included</h4>
                  <ul className="space-y-3 max-w-sm">
                    {primaryExperience.includes?.slice(0, 5).map((item, index) => (
                      <motion.li
                        key={index}
                        className="flex items-center gap-3 text-foreground/80 text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                      >
                        <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" aria-hidden="true" />
                        <span>{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                  <div className="mt-8 pt-8 border-t border-border flex items-center justify-between">
                    <span className="text-foreground/60">Starting from</span>
                    <span className="text-3xl font-display font-medium text-foreground">{primaryExperience.currency || "$"}{primaryExperience.price?.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        )}

        <motion.div
          className="grid gap-6 lg:grid-cols-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {secondaryExperiences.map((experience, index) => (
            <motion.div key={experience.id} variants={cardVariants} style={{ transitionDelay: `${index * 100}ms` }}>
              <Link
                href={resolvedViewAllHref}
                className="group block glass-card overflow-hidden aspect-[4/3] elegant-shadow-hover flex flex-col"
                aria-label={`Explore ${experience.name}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden flex-shrink-0">
                  <Image
                    src={experience.image}
                    alt=""
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    quality={85}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-white/80 text-sm mb-3">
                    {categoryIcons[experience.category] || categoryIcons.default}
                    <span className="font-medium">{experience.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[experience.difficulty || "easy"]}`}>
                      {experience.difficulty ? experience.difficulty.charAt(0).toUpperCase() + experience.difficulty.slice(1) : ""}
                    </span>
                  </div>
                  <h3 className="heading-card text-white mb-2 group-hover:text-accent-light transition-colors flex-1">
                    {experience.name}
                  </h3>
                  <p className="text-white/80 text-sm mb-4 line-clamp-2 flex-1">{experience.shortDescription || experience.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm mb-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      <span>{experience.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" aria-hidden="true" />
                      <span>{experience.groupSize}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" aria-hidden="true" />
                      <span>{experience.location?.city ?? experience.location?.country ?? ""}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/20">
                    <span className="text-xl font-display font-medium text-white">{experience.currency || "$"}{experience.price?.toLocaleString()}</span>
                    <div className="flex items-center gap-1 text-white/80 group-hover:gap-2 transition-all">
                      <span className="text-sm font-medium">View Details</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
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