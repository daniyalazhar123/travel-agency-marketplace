"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { type TenantConfig } from "@/lib/tenant/config";

interface HeroProps {
  tenant: TenantConfig;
  currentTenantSlug: string;
}

const easing = [0.4, 0, 0.2, 1] as const;
const springEasing = [0.34, 1.56, 0.64, 1] as const;

const heroVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easing },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easing },
  },
};

const getCTAClassName = (variant: string) => {
  switch (variant) {
    case "primary": return "btn-primary";
    case "secondary": return "btn-secondary";
    case "accent": return "btn-accent";
    case "ghost": return "btn-ghost bg-white/10 text-white border-white/20 hover:bg-white/20";
    default: return "btn-primary";
  }
};

export function Hero({ tenant, currentTenantSlug }: HeroProps) {
  const heroConfig = tenant.hero ?? {
    headline: "Your next extraordinary journey begins here",
    subheadline: "Curated luxury experiences for the discerning traveler",
    primaryCTA: { label: "Explore Destinations", href: "/explore", variant: "primary" as const },
    secondaryCTA: { label: "View Experiences", href: "/experiences", variant: "secondary" as const },
    overlayOpacity: 0.4,
  };

  const backgroundImage = heroConfig.backgroundImage ?? "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=2400&q=80";
  const overlayOpacity = heroConfig.overlayOpacity ?? 0.4;

  const primaryCTA = heroConfig.primaryCTA;
  const secondaryCTA = heroConfig.secondaryCTA;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" aria-labelledby="hero-heading">
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundImage}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
          quality={90}
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(12, 10, 9, ${overlayOpacity})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" aria-hidden="true" />
      </div>

      <div className="relative z-10 container-page px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={heroVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-8 flex items-center justify-center gap-3">
            <motion.span
              className="label px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4, ease: springEasing }}
            >
              <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" />
              Curated Luxury Journeys
            </motion.span>
          </motion.div>

          <motion.h1
            id="hero-heading"
            variants={itemVariants}
            className="heading-hero text-white mb-6 text-balance"
          >
            {heroConfig.headline}
          </motion.h1>

          {heroConfig.subheadline && (
            <motion.p variants={itemVariants} className="body-lg text-white/90 max-w-2xl mx-auto mb-10 text-balance">
              {heroConfig.subheadline}
            </motion.p>
          )}

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {primaryCTA && (
              <motion.div variants={buttonVariants} style={{ transitionDelay: "0ms" }}>
                <Link
                  href={`/${currentTenantSlug}${primaryCTA.href.startsWith("/") ? primaryCTA.href : "/" + primaryCTA.href}`}
                  className={`${getCTAClassName(primaryCTA.variant || "primary")} group px-10 py-4 text-lg`}
                >
                  {primaryCTA.label}
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </motion.div>
            )}
            {secondaryCTA && (
              <motion.div variants={buttonVariants} style={{ transitionDelay: "100ms" }}>
                <Link
                  href={`/${currentTenantSlug}${secondaryCTA.href.startsWith("/") ? secondaryCTA.href : "/" + secondaryCTA.href}`}
                  className={`${getCTAClassName(secondaryCTA.variant || "secondary")} px-10 py-4 text-lg`}
                >
                  {secondaryCTA.label}
                </Link>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-16 flex items-center justify-center gap-8 text-white/70 text-sm"
          >
            <div className="flex items-center gap-2">
              <div className="w-16 h-px bg-white/30" />
              <span>Handpicked Destinations</span>
              <div className="w-16 h-px bg-white/30" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-px bg-white/30" />
              <span>Personalized Service</span>
              <div className="w-16 h-px bg-white/30" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-px bg-white/30" />
              <span>24/7 Concierge</span>
              <div className="w-16 h-px bg-white/30" />
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8, ease: easing }}
        >
          <p className="text-white/60 text-xs tracking-widest uppercase">Scroll to explore</p>
          <motion.div
            className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          >
            <motion.div
              className="w-1.5 h-1.5 bg-white/60 rounded-full"
              animate={{ y: [0, 6, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}