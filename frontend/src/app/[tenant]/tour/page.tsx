"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import { getTenantConfig } from "@/lib/tenant/config";
import { FadeUp, StaggerGrid, PageTransition, cardVariants } from "@/lib/motion-primitives";
import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";

const interiorShots = [
  {
    id: "lobby",
    title: "Grand Lobby",
    subtitle: "A warm welcome in marble and brass",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: "consultation",
    title: "Private Consultation",
    subtitle: "One-on-one planning in serene spaces",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: "lounge",
    title: "Luxury Lounge",
    subtitle: "Relax and refine your next journey",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: "map-wall",
    title: "World Map Wall",
    subtitle: "Where dreams meet destinations",
    image: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2000&auto=format&fit=crop",
  },
];

const stats = [
  { label: "Years of Excellence", value: 10, suffix: "+" },
  { label: "Happy Travelers", value: 5000, suffix: "+" },
  { label: "Luxury Destinations", value: 50, suffix: "+" },
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = {
      update: (v: number) => setDisplay(Math.round(v)),
    };
    let start: number;
    const duration = 1500;

    function animate(timestamp: number) {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      controls.update(eased * value);
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span className="font-display text-4xl md:text-5xl font-medium text-foreground">
      {display}
      {suffix}
    </span>
  );
}

function Typewriter({ text }: { text: string }) {
  const [visibleChars, setVisibleChars] = useState(0);
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleChars(i);
      if (i >= text.length) clearInterval(interval);
    }, 80);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <motion.span
      className="text-2xl md:text-3xl text-accent font-medium"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {text.slice(0, visibleChars)}
      {visibleChars < text.length && (
        <motion.span
          className="inline-block w-0.5 h-5 bg-accent ml-1"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </motion.span>
  );
}

export default function TenantTourPage({ params }: { params: Promise<{ tenant: string }> }) {
  const [resolvedTenant, setResolvedTenant] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then((p) => setResolvedTenant(p.tenant));
  }, [params]);

  const tenant = getTenantConfig(resolvedTenant);
  if (!tenant) return null;

  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start center", "end center"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

  return (
    <PageTransition>
      {/* SECTION 1: HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
          alt="Wanderlust Travel Co. exterior"
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <FadeUp delay={0.2}>
            <h1 className="heading-section text-4xl md:text-5xl lg:text-6xl font-display text-white mb-6">
              Wanderlust Travel Co.
            </h1>
          </FadeUp>

          <FadeUp delay={0.4}>
            <Typewriter text="Where Luxury Journeys Begin" />
          </FadeUp>

          <FadeUp delay={0.8}>
            <p className="body-lg text-white/80 text-balance mt-6 max-w-2xl mx-auto">
              Step into a world where every detail is curated, every experience is extraordinary,
              and every journey begins with a single, perfect moment.
            </p>
          </FadeUp>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/60"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <span className="text-xs uppercase tracking-wider mb-2">Scroll to explore</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* SECTION 2: INTERIOR VIRTUAL TOUR */}
      <section
        ref={scrollRef}
        className="relative min-h-[120vh] py-24 overflow-hidden hidden-scrollbar"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-accent/15 via-transparent to-primary/15 rounded-full blur-3xl" />
        </div>

        <div className="container-page relative z-10">
          <div className="text-center mb-16">
            <FadeUp>
              <h2 className="heading-section text-foreground mb-4">Our Physical Spaces</h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="body-lg text-muted-foreground text-balance max-w-2xl mx-auto">
                Every corner of our agency is designed to inspire wanderlust and ensure your journey begins in comfort.
              </p>
            </FadeUp>
          </div>

          {/* Horizontal scroll on desktop, vertical stack on mobile */}
          <div className="hidden md:flex gap-8">
            {interiorShots.map((shot, index) => (
              <motion.div
                key={shot.id}
                className="w-[320px] flex-none"
                style={{ x }}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                custom={index * 0.1}
              >
                <motion.div
                  className="glass-card overflow-hidden elegant-shadow-hover group cursor-pointer"
                  whileHover={{ scale: 1.05, y: -8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={shot.image}
                      alt={shot.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="heading-card text-white mb-1">{shot.title}</h3>
                      <p className="text-sm text-white/70">{shot.subtitle}</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Mobile vertical stack */}
          <div className="md:hidden space-y-8">
            {interiorShots.map((shot, index) => (
              <motion.div
                key={shot.id}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                custom={index * 0.1}
              >
                <motion.div
                  className="glass-card overflow-hidden elegant-shadow-hover group cursor-pointer"
                  whileHover={{ scale: 1.03, y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={shot.image}
                      alt={shot.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="heading-card text-white mb-1">{shot.title}</h3>
                      <p className="text-sm text-white/70">{shot.subtitle}</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: STATS */}
      <section className="py-20 bg-muted/30">
        <div className="container-page">
          <div className="text-center mb-12">
            <FadeUp>
              <h2 className="heading-section text-foreground mb-4">Agency Values</h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="body-lg text-muted-foreground">
                Built on trust, expertise, and an unwavering passion for discovery.
              </p>
            </FadeUp>
          </div>

          <StaggerGrid className="grid gap-8 sm:grid-cols-3">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                className="glass-card p-8 text-center"
                variants={cardVariants}
                whileHover="hover"
              >
                <div className="mb-4">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* SECTION 4: CTA */}
      <section className="relative py-28 bg-gradient-to-br from-primary via-primary/90 to-accent/30 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="container-page relative z-10 text-center">
          <FadeUp>
            <h2 className="heading-section text-white mb-6 text-balance">
              Ready to Experience the Extraordinary?
            </h2>
          </FadeUp>

          <FadeUp delay={0.2}>
            <p className="body-lg text-white/80 text-balance mb-10 max-w-xl mx-auto">
              Your dream journey is just one conversation away. Let's craft something unforgettable together.
            </p>
          </FadeUp>

          <FadeUp delay={0.4}>
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Link
                href={`/${resolvedTenant}/destinations`}
                className="btn-primary btn-shimmer inline-flex items-center gap-2 px-12 py-5 text-lg text-primary-foreground"
              >
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
              </Link>
            </motion.div>
          </FadeUp>
        </div>
      </section>
    </PageTransition>
  );
}
