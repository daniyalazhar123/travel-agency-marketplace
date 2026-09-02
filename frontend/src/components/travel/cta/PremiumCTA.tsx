"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Shield, Heart, Star, Award } from "lucide-react";

interface PremiumCTAProps {
  currentTenantSlug: string;
  title?: string;
  subtitle?: string;
  primaryCTA?: { label: string; href: string };
  secondaryCTA?: { label: string; href: string };
  features?: CTAFeature[];
  backgroundImage?: string;
}

interface CTAFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const defaultFeatures: CTAFeature[] = [
  {
    icon: <Shield className="w-6 h-6" aria-hidden="true" />,
    title: "Personalized Planning",
    description: "Dedicated travel designers craft every detail of your journey.",
  },
  {
    icon: <Heart className="w-6 h-6" aria-hidden="true" />,
    title: "Exclusive Access",
    description: "Private experiences and properties unavailable to the public.",
  },
  {
    icon: <Star className="w-6 h-6" aria-hidden="true" />,
    title: "24/7 Concierge",
    description: "Round-the-clock support before, during, and after your trip.",
  },
  {
    icon: <Award className="w-6 h-6" aria-hidden="true" />,
    title: "Curated Excellence",
    description: "Every partner vetted for exceptional quality and service.",
  },
];

const easing = [0.4, 0, 0.2, 1] as const;
const springEasing = [0.34, 1.56, 0.64, 1] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easing },
  },
};

export function PremiumCTA({
  currentTenantSlug,
  title = "Your next extraordinary journey starts here",
  subtitle = "Let us craft an experience that exceeds every expectation. Your only task is to arrive.",
  primaryCTA = { label: "Begin Planning", href: "/booking" },
  secondaryCTA = { label: "Explore Destinations", href: "/explore" },
  features = defaultFeatures,
  backgroundImage = "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=2400&q=80",
}: PremiumCTAProps) {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden" aria-labelledby="cta-heading">
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundImage}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          quality={90}
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/90 to-secondary/95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 400 400%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.03%22/%3E%3C/svg%3E')] opacity-100" aria-hidden="true" />
      </div>

      <div className="relative z-10 container-page">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-8 flex items-center justify-center gap-3">
            <motion.span
              className="label px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4, ease: springEasing }}
            >
              <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" />
              Ready to Begin Your Journey
            </motion.span>
          </motion.div>

          <motion.h2
            id="cta-heading"
            variants={itemVariants}
            className="heading-hero text-white mb-6 text-balance"
          >
            {title}
          </motion.h2>

          <motion.p variants={itemVariants} className="body-lg text-white/90 max-w-2xl mx-auto mb-12 text-balance">
            {subtitle}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 lg:mb-20"
          >
            {primaryCTA && (
              <motion.div className="w-full sm:w-auto">
                <Link
                  href={`/${currentTenantSlug}${primaryCTA.href.startsWith("/") ? primaryCTA.href : "/" + primaryCTA.href}`}
                  className="btn-primary group w-full sm:w-auto px-10 py-4 text-lg"
                >
                  {primaryCTA.label}
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </motion.div>
            )}
            {secondaryCTA && (
              <motion.div className="w-full sm:w-auto">
                <Link
                  href={`/${currentTenantSlug}${secondaryCTA.href.startsWith("/") ? secondaryCTA.href : "/" + secondaryCTA.href}`}
                  className="btn-secondary group w-full sm:w-auto px-10 py-4 text-lg border-white/30 text-white hover:bg-white/10"
                >
                  {secondaryCTA.label}
                </Link>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                style={{ transitionDelay: `${index * 100}ms` }}
                className="text-center p-6"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white group-hover:bg-white/20 transition-all duration-300">
                  {feature.icon}
                </div>
                <h4 className="heading-card text-white mb-2">{feature.title}</h4>
                <p className="text-white/80 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}