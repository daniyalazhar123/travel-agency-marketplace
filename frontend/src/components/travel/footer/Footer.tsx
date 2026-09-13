"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, ArrowRight, Globe, MessageSquare, Users, Send, Monitor, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { type TenantConfig, type SocialLink } from "@/lib/tenant/config";

interface FooterProps {
  tenant: TenantConfig;
  currentTenantSlug: string;
}

const defaultSocialLinks: SocialLink[] = [
  { platform: "instagram", url: "#", label: "Instagram" },
  { platform: "facebook", url: "#", label: "Facebook" },
  { platform: "twitter", url: "#", label: "Twitter" },
  { platform: "youtube", url: "#", label: "YouTube" },
];

const socialIcons: Record<string, React.ReactNode> = {
  instagram: <MessageSquare className="w-5 h-5" aria-hidden="true" />,
  facebook: <Users className="w-5 h-5" aria-hidden="true" />,
  twitter: <Send className="w-5 h-5" aria-hidden="true" />,
  youtube: <Monitor className="w-5 h-5" aria-hidden="true" />,
  linkedin: <Globe className="w-5 h-5" aria-hidden="true" />,
  pinterest: <Globe className="w-5 h-5" aria-hidden="true" />,
  default: <Globe className="w-5 h-5" aria-hidden="true" />,
};

const getSocialIcon = (platform: string) => {
  return socialIcons[platform] || socialIcons.default;
};

// Only routes that actually exist. Dead links were 404ing (trust killer).
const navigationSections = {
  explore: [
    { label: "All Destinations", href: "/destinations" },
    { label: "Experiences", href: "/experiences" },
    { label: "Travel Journal", href: "/journal" },
    { label: "About Us", href: "/about" },
  ],
  destinations: [
    { label: "All Destinations", href: "/destinations" },
    { label: "Experiences", href: "/experiences" },
    { label: "Plan a Journey", href: "/booking" },
    { label: "Contact Us", href: "/contact" },
  ],
  support: [
    { label: "Contact Us", href: "/contact" },
    { label: "Plan Your Trip", href: "/booking" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

type NewsletterState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function Footer({ tenant, currentTenantSlug }: FooterProps) {
  const socialLinks = tenant.socialLinks?.length ? tenant.socialLinks : defaultSocialLinks;
  const contact = tenant.contact || {};
  const currentYear = new Date().getFullYear();

  const [email, setEmail] = useState("");
  const [state, setState] = useState<NewsletterState>({ status: "idle" });

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.status === "loading") return;

    // Quick client-side sanity (server re-validates with Zod)
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setState({ status: "error", message: "Please enter a valid email address." });
      return;
    }

    setState({ status: "loading" });
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          tenantId: currentTenantSlug || tenant.id || "demo",
          source: "newsletter",
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { success: boolean; message?: string; error?: string }
        | null;

      if (res.ok && json?.success) {
        setState({ status: "success", message: json.message ?? "Thank you for subscribing!" });
        setEmail("");
      } else {
        setState({ status: "error", message: json?.error ?? "Something went wrong. Please try again." });
      }
    } catch {
      setState({ status: "error", message: "Network error — please check your connection and try again." });
    }
  };

  return (
    <footer className="bg-primary text-on-primary" role="contentinfo" aria-label="Site footer">
      <div className="container-page py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 xl:grid-cols-5 mb-16 lg:mb-20">
          <div className="xl:col-span-2 lg:col-span-2">
            <Link href={`/${currentTenantSlug}`} className="block mb-6" aria-label={`${tenant.name} - Home`}>
              <span className="text-display text-2xl font-medium tracking-tight text-white">
                {tenant.name}
              </span>
            </Link>
            <p className="text-white/70 text-base mb-8 max-w-xs lg:max-w-sm leading-relaxed">
              {tenant.description || "Curating extraordinary journeys for the discerning traveler since our founding. Experience the world differently."}
            </p>
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-3 text-white/70 hover:text-white transition-colors mb-3"
              >
                <Mail className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span>{contact.email}</span>
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-3 text-white/70 hover:text-white transition-colors mb-3"
              >
                <Phone className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span>{contact.phone}</span>
              </a>
            )}
            {contact.address && (
              <address className="flex items-start gap-3 text-white/70 not-italic max-w-xs">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{contact.address}</span>
              </address>
            )}
          </div>

          <nav aria-label="Explore">
            <h3 className="label text-accent mb-4 uppercase tracking-widest">Explore</h3>
            <ul className="space-y-3" role="list">
              {navigationSections.explore.map((item) => (
                <li key={item.label}>
                  <Link
                    href={`/${currentTenantSlug}${item.href}`}
                    className="text-white/70 hover:text-white transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Destinations">
            <h3 className="label text-accent mb-4 uppercase tracking-widest">Journeys</h3>
            <ul className="space-y-3" role="list">
              {navigationSections.destinations.map((item) => (
                <li key={item.label}>
                  <Link
                    href={`/${currentTenantSlug}${item.href}`}
                    className="text-white/70 hover:text-white transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Real newsletter signup — posts to /api/newsletter */}
          <div>
            <h3 className="label text-accent mb-4 uppercase tracking-widest">Stay Inspired</h3>
            <p className="text-white/70 text-sm mb-4 leading-relaxed">
              Monthly dispatches of extraordinary destinations and member-only journeys.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3" noValidate>
              <label htmlFor="newsletter-email" className="sr-only">
                Email address for newsletter
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" aria-hidden="true" />
                <input
                  id="newsletter-email"
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (state.status === "error") setState({ status: "idle" });
                  }}
                  disabled={state.status === "loading"}
                  maxLength={320}
                  className="w-full rounded-lg bg-white/10 border border-white/20 pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all disabled:opacity-60"
                />
              </div>
              <button
                type="submit"
                disabled={state.status === "loading"}
                className="btn-accent w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {state.status === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Subscribing...
                  </>
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
            {state.status === "success" && (
              <motion.p
                role="status"
                aria-live="polite"
                className="flex items-start gap-2 text-sm text-white/90 mt-3"
                initial={{ opacity: 0, scale: 0.9, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
              >
                <motion.span
                  className="mt-0.5 shrink-0 text-accent"
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.08 }}
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                </motion.span>
                {state.message}
              </motion.p>
            )}
            {state.status === "error" && (
              <p role="alert" className="flex items-start gap-2 text-sm text-white/90 mt-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-error" aria-hidden="true" />
                {state.message}
              </p>
            )}
          </div>
        </div>

        <div className="pt-8 lg:pt-12 border-t border-white/10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <p className="text-white/50 text-sm">
              © {currentYear} {tenant.name}. All rights reserved.
            </p>

            <div className="flex items-center gap-6">
              <nav aria-label="Social media" className="flex items-center gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.platform}
                    href={social.url}
                    className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition-all duration-300 hover:-translate-y-1 hover:rotate-6 hover:bg-white/20 hover:text-white focus-visible:-translate-y-1 focus-visible:bg-white/20"
                    aria-label={social.label || social.platform}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {getSocialIcon(social.platform)}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          <div className="mt-8 lg:mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <nav aria-label="Legal" className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6">
                <Link href={`/${currentTenantSlug}/privacy`} className="text-white/50 hover:text-white/70 transition-colors text-sm">
                  Privacy Policy
                </Link>
                <Link href={`/${currentTenantSlug}/terms`} className="text-white/50 hover:text-white/70 transition-colors text-sm">
                  Terms of Service
                </Link>
                <Link href={`/${currentTenantSlug}/contact`} className="text-white/50 hover:text-white/70 transition-colors text-sm">
                  Contact
                </Link>
              </nav>

              <p className="text-white/40 text-xs text-center sm:text-left">
                A premium travel template. Configure for your agency.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
