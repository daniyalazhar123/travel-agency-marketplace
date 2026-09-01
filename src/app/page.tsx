import { Metadata } from "next";
import Link from "next/link";
import { getAllTenantIds, getTenantConfig, defaultTenantConfig } from "@/lib/tenant/config";
import { Navigation } from "@/components/travel/navigation/Navigation";
import { PremiumCTA } from "@/components/travel/cta/PremiumCTA";
import { Footer } from "@/components/travel/footer/Footer";
import { ArrowRight } from "lucide-react";
import { Globe, Palette, Search, BookOpen, Zap, Shield, Code, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const tenantIds = getAllTenantIds();
const tenants = tenantIds.map((id) => getTenantConfig(id)).filter((t): t is NonNullable<typeof t> => t !== null);

const marketplaceTenant = { ...defaultTenantConfig, id: "marketplace", name: "Travel Marketplace" };

export const metadata: Metadata = {
  title: "Travel Agency Marketplace",
  description: "Ultra-premium multi-tenant travel marketplace platform",
};

export default async function RootPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation
        tenant={marketplaceTenant}
        currentTenantSlug=""
      />
      <main id="main-content">
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden" aria-labelledby="marketplace-heading">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent/20" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 400 400%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.03%22/%3E%3C/svg%3E')] opacity-100" aria-hidden="true" />
          </div>
          <div className="relative z-10 container-page text-center py-20">
            <span className="label px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white inline-block mb-8">
              White-Label Travel Platform
            </span>
            <h1 id="marketplace-heading" className="heading-hero text-white mb-6 text-balance">
              The Platform Behind Extraordinary Journeys
            </h1>
            <p className="body-lg text-white/90 max-w-3xl mx-auto mb-12 text-balance">
              A premium, production-ready travel agency template designed for white-label resale. 
              Deploy customized instances for multiple agencies from a single codebase.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/demo/explore"
                className="btn-primary group px-10 py-4 text-lg"
              >
                View Demo Agency
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link
                href="#features"
                className="btn-secondary group px-10 py-4 text-lg border-white/30 text-white hover:bg-white/10"
              >
                Explore Features
              </Link>
            </div>
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <p className="text-white/60 text-xs tracking-widest uppercase">Scroll to explore</p>
            <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2" aria-hidden="true">
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" />
            </div>
          </div>
        </section>

        <section id="features" className="py-20 lg:py-28 bg-muted/30" aria-labelledby="features-heading">
          <div className="container-page">
            <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
              <span className="label text-accent mb-4 inline-block">Platform Features</span>
              <h2 id="features-heading" className="heading-section text-foreground mb-4">
                Built for Premium Travel Brands
              </h2>
              <p className="body-lg text-balance">
                Every component designed for luxury travel. Every feature engineered for commercial resale.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                title="Multi-Tenant Architecture"
                description="Deploy unlimited agency instances from one codebase. Each tenant fully isolated with independent configuration."
                icon={<Globe className="w-6 h-6" />}
              />
              <FeatureCard
                title="Design System"
                description="Centralized tokens for colors, typography, spacing, shadows. Rebrand in minutes, not days."
                icon={<Palette className="w-6 h-6" />}
              />
              <FeatureCard
                title="Booking Engine Ready"
                description="Flights, stays, experiences search interface. Clean abstraction for API integration."
                icon={<Search className="w-6 h-6" />}
              />
              <FeatureCard
                title="Editorial CMS Ready"
                description="Travel journal, destination guides, experience stories. Content-driven by design."
                icon={<BookOpen className="w-6 h-6" />}
              />
              <FeatureCard
                title="Performance Optimized"
                description="Next.js 16, React 19, Turbopack. Server components by default. Optimized images and fonts."
                icon={<Zap className="w-6 h-6" />}
              />
              <FeatureCard
                title="Accessibility First"
                description="WCAG 2.1 AA compliant. Semantic HTML, keyboard navigation, reduced motion support."
                icon={<Shield className="w-6 h-6" />}
              />
              <FeatureCard
                title="Type-Safe Configuration"
                description="Full TypeScript tenant config. Compile-time validation of all agency customizations."
                icon={<Code className="w-6 h-6" />}
              />
              <FeatureCard
                title="Modern Stack"
                description="Tailwind CSS v4, Framer Motion, shadcn/ui. Zero legacy dependencies."
                icon={<Layers className="w-6 h-6" />}
              />
            </div>
          </div>
        </section>

        {tenants.length > 0 && (
          <section className="py-20 lg:py-28" aria-labelledby="tenants-heading">
            <div className="container-page">
              <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
                <span className="label text-accent mb-4 inline-block">Live Instances</span>
                <h2 id="tenants-heading" className="heading-section text-foreground mb-4">
                  Deployed Agencies
                </h2>
                <p className="body-lg text-balance">
                  Each agency runs on the same platform with unique branding, content, and configuration.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {tenants.map((tenant) => (
                  <Link
                    key={tenant.id}
                    href={`/${tenant.id}/explore`}
                    className="group glass-card overflow-hidden aspect-[4/3] elegant-shadow-hover flex flex-col"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white/60 text-4xl font-display font-medium">{tenant.name.charAt(0)}</span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="heading-card text-foreground mb-2 group-hover:text-accent transition-colors">
                        {tenant.name}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 flex-1">{tenant.tagline}</p>
                      <div className="flex items-center gap-2 text-accent font-medium group-hover:gap-3 transition-all">
                        <span className="text-sm">Explore Agency</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <PremiumCTA
          currentTenantSlug="demo"
          title="Ready to launch your travel brand?"
          subtitle="Deploy a premium travel agency website in days, not months. Full source code, zero vendor lock-in."
          primaryCTA={{ label: "Get Started", href: "/explore" }}
          secondaryCTA={{ label: "View Documentation", href: "/about" }}
          backgroundImage="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=2400&q=80"
        />

        <Footer
          tenant={marketplaceTenant}
          currentTenantSlug=""
        />
      </main>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <Card className="glass-card h-full transition-all duration-300 group hover:shadow-glass-hover">
      <CardHeader>
        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:bg-accent group-hover:text-on-accent transition-all duration-300">
          {icon}
        </div>
        <CardTitle className="text-lg font-medium text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base text-muted-foreground">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}