"use client";

/**
 * Client half of /[tenant]/experiences.
 *
 * Owns the Framer Motion card grid (motion.div + whileHover) and the
 * animated CTA; the page (Server Component) derives the filtered list
 * and passes plain serializable props.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Star, ArrowRight, Clock, Users, Zap, Shield } from "lucide-react";
import { FilterBar } from "@/components/travel/filter/FilterBar";
import { StaggerGrid, FadeUp, cardVariants } from "@/lib/motion-primitives";
import type { Experience } from "@/lib/tenant/config";

interface ExperiencesClientProps {
  tenantSlug: string;
  experiences: Experience[];
  categories: string[];
  difficulties: ("easy" | "moderate" | "challenging")[];
  selectedCategory: string | undefined;
  selectedDifficulty: string | undefined;
}

const formatPrice = (price?: number, currency = "USD") => {
  if (!price) return "Contact for pricing";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const difficultyColors = {
  easy: "bg-green-100 text-green-800",
  moderate: "bg-amber-100 text-amber-800",
  challenging: "bg-red-100 text-red-800",
};

const difficultyIcons = {
  easy: <Zap className="w-3 h-3" aria-hidden="true" />,
  moderate: <Users className="w-3 h-3" aria-hidden="true" />,
  challenging: <Shield className="w-3 h-3" aria-hidden="true" />,
};

export function ExperiencesClient({
  tenantSlug,
  experiences,
  categories,
  difficulties,
  selectedCategory,
  selectedDifficulty,
}: ExperiencesClientProps) {
  return (
    <>
      <FadeUp className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
        <span className="label text-accent mb-4 inline-block">Curated Moments</span>
        <h1 className="heading-section text-foreground mb-4">Extraordinary Experiences</h1>
        <p className="body-lg text-balance">
          Hand-crafted journeys designed for those who seek the exceptional.
          From private cultural immersions to adventure expeditions in style.
        </p>
      </FadeUp>

      {categories.length > 0 && (
        <FilterBar
          options={categories.map((c) => ({ label: c, value: c }))}
          selectedValue={selectedCategory ?? null}
          basePath={`/${tenantSlug}/experiences`}
          queryParam="category"
          label="Filter experiences by category"
        />
      )}

      {difficulties.length > 0 && (
        <FilterBar
          options={difficulties.map((d) => ({ label: d.charAt(0).toUpperCase() + d.slice(1), value: d }))}
          selectedValue={selectedDifficulty ?? null}
          basePath={`/${tenantSlug}/experiences`}
          queryParam="difficulty"
          label="Filter experiences by difficulty"
        />
      )}

      <StaggerGrid className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {experiences.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <Star className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" aria-hidden="true" />
            <h3 className="heading-card text-foreground mb-2">No experiences found</h3>
            <p className="text-muted-foreground">
              {selectedCategory || selectedDifficulty
                ? "No experiences match your filters."
                : "No experiences configured for this agency."}
            </p>
            <Link
              href={`/${tenantSlug}/experiences`}
              className="btn-secondary inline-flex items-center gap-2 mt-4"
            >
              View All Experiences
            </Link>
          </div>
        ) : (
          experiences.map((experience) => (
            <motion.div key={experience.id} variants={cardVariants} whileHover="hover">
              <Link
                href={`/${tenantSlug}/experiences/${experience.id}`}
                className="group glass-card overflow-hidden elegant-shadow-hover flex flex-col h-full"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={experience.image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" aria-hidden="true" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1.5 rounded-full bg-white/90 text-primary text-xs font-medium backdrop-blur-sm">
                      {experience.category}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${difficultyColors[experience.difficulty || "easy"]} backdrop-blur-sm`}>
                      <span className="flex items-center gap-1">
                        {difficultyIcons[experience.difficulty || "easy"]}
                        {experience.difficulty ? experience.difficulty.charAt(0).toUpperCase() + experience.difficulty.slice(1) : "Easy"}
                      </span>
                    </span>
                  </div>
                  {experience.price && (
                    <div className="absolute bottom-4 left-4">
                      <span className="px-4 py-2 rounded-full bg-accent/90 text-on-accent text-sm font-display font-medium">
                        {formatPrice(experience.price, experience.currency)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="heading-card text-foreground mb-2 group-hover:text-accent transition-colors">
                    {experience.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 flex-1 line-clamp-2">{experience.shortDescription || experience.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/70 mb-4">
                    {experience.duration && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        {experience.duration}
                      </span>
                    )}
                    {experience.groupSize && (
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" aria-hidden="true" />
                        {experience.groupSize}
                      </span>
                    )}
                    {experience.location?.country && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" aria-hidden="true" />
                        {experience.location.city ? `${experience.location.city}, ` : ""}{experience.location.country}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <span className="text-sm font-medium text-foreground">View Details</span>
                    <ArrowRight className="w-4 h-4 text-accent group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </StaggerGrid>

      {experiences.length > 0 && !selectedCategory && !selectedDifficulty && (
        <div className="mt-16 lg:mt-20 text-center">
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
            <Link
              href={`/${tenantSlug}/explore`}
              className="btn-secondary inline-flex items-center gap-2 px-10 py-4 text-lg"
            >
              View All on Explore Page
              <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
            </Link>
          </motion.div>
        </div>
      )}
    </>
  );
}
