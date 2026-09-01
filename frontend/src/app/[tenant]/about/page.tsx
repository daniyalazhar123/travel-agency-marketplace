import { Metadata } from "next";
import { getTenantConfig } from "@/lib/tenant/config";
import { Footer } from "@/components/travel/footer/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Globe, Star, Shield, Leaf, Heart, ArrowRight, Award, Sparkles } from "lucide-react";
import Link from "next/link";

interface TenantPageProps {
  params: Promise<{ tenant: string }>;
}

export async function generateMetadata({ params }: TenantPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const tenant = getTenantConfig(resolvedParams.tenant);

  if (!tenant) {
    return { title: "Tenant Not Found" };
  }

  return {
    title: `About - ${tenant.name}`,
    description: `Learn about ${tenant.name} - ${tenant.description}`,
  };
}

const values = [
  {
    icon: Heart,
    title: "Personalized Service",
    description: "Every journey is tailored to your unique preferences, pace, and dreams. No two itineraries are alike.",
  },
  {
    icon: Globe,
    title: "Global Expertise",
    description: "Decades of relationships with the world's finest hotels, guides, and local experts across six continents.",
  },
  {
    icon: Shield,
    title: "Trusted Partnerships",
    description: "We work exclusively with vetted partners who share our commitment to excellence and authenticity.",
  },
  {
    icon: Leaf,
    title: "Sustainable Travel",
    description: "Conscious luxury that preserves destinations for future generations while supporting local communities.",
  },
  {
    icon: Award,
    title: "Uncompromising Quality",
    description: "Every detail verified, every experience tested. We stake our reputation on your satisfaction.",
  },
  {
    icon: Sparkles,
    title: "Beyond Expectations",
    description: "We anticipate needs you didn't know you had, transforming travel into transformation.",
  },
];

const team = [
  {
    name: "Isabella Montenegro",
    role: "Founder & Creative Director",
    bio: "Former luxury hotelier with 20+ years crafting bespoke journeys for discerning clients worldwide.",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80",
  },
  {
    name: "Marcus Chen",
    role: "Head of Experience Design",
    bio: "Cultural anthropologist turned travel designer, specializing in authentic immersive journeys across Asia.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  },
  {
    name: "Sophie Laurent",
    role: "Director of Partnerships",
    bio: "Built relationships with 200+ luxury properties and private estates across Europe and the Mediterranean.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
  },
  {
    name: "James Okafor",
    role: "Safari & Adventure Specialist",
    bio: "Conservationist and guide with deep expertise in African wilderness experiences and luxury mobile camps.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
  },
];

const stats = [
  { value: "150+", label: "Destinations Curated" },
  { value: "98%", label: "Client Return Rate" },
  { value: "20+", label: "Years of Excellence" },
  { value: "24/7", label: "Concierge Support" },
];

export default async function TenantAboutPage({ params }: TenantPageProps) {
  const resolvedParams = await params;
  const tenant = getTenantConfig(resolvedParams.tenant);

  if (!tenant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main>
        <section className="relative min-h-[70vh] flex items-center overflow-hidden" aria-labelledby="about-hero-heading">
          <div className="absolute inset-0 z-0">
            <img
              src={tenant.hero?.backgroundImage || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=2400&q=80"}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-primary/60" style={{ opacity: tenant.hero?.overlayOpacity ?? 0.4 }} />
          </div>
          <div className="relative z-10 container-page py-20 lg:py-28">
            <div className="max-w-3xl">
              <span className="label px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white inline-block mb-6">
                Our Story
              </span>
              <h1 id="about-hero-heading" className="heading-hero text-white mb-6 text-balance">
                Crafting Journeys Beyond Imagination
              </h1>
              <p className="body-lg text-white/90 max-w-2xl text-balance">
                {tenant.description || "Founded on the belief that travel should transform, not just transport. We curate extraordinary journeys for those who seek the exceptional."}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button variant="secondary" className="border-white/30 text-white hover:bg-white/10 px-8 py-3" asChild>
                  <Link href={`/${resolvedParams.tenant}/contact`}>
                    Start Your Journey
                    <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                  </Link>
                </Button>
                <Button variant="ghost" className="text-white hover:bg-white/10 px-8 py-3" asChild>
                  <Link href={`/${resolvedParams.tenant}/explore`}>
                    View Destinations
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-muted/30" aria-labelledby="values-heading">
          <div className="container-page">
            <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
              <span className="label text-accent mb-4 inline-block">Our Philosophy</span>
              <h2 id="values-heading" className="heading-section text-foreground mb-4">
                The Principles That Guide Us
              </h2>
              <p className="body-lg text-balance">
                Six core values shape every journey we design, every partner we choose, and every moment we create.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((value) => (
                <Card key={value.title} className="glass-card h-full transition-all duration-300 hover:shadow-glass-hover">
                  <CardHeader>
                    <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4">
                      <value.icon className="w-7 h-7" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-lg font-medium text-foreground">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-muted-foreground">{value.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28" aria-labelledby="stats-heading">
          <div className="container-page">
            <div className="grid gap-8 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-5xl lg:text-6xl font-display font-medium text-foreground mb-2">{stat.value}</div>
                  <div className="body-base text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-muted/30" aria-labelledby="team-heading">
          <div className="container-page">
            <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
              <span className="label text-accent mb-4 inline-block">Our People</span>
              <h2 id="team-heading" className="heading-section text-foreground mb-4">
                Meet Our Travel Designers
              </h2>
              <p className="body-lg text-balance">
                Passionate experts who have explored the world to bring you its most extraordinary experiences.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {team.map((member) => (
                <Card key={member.name} className="glass-card overflow-hidden">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <CardContent className="p-6 space-y-3">
                    <h3 className="heading-card text-foreground">{member.name}</h3>
                    <p className="text-accent text-sm font-medium">{member.role}</p>
                    <p className="text-muted-foreground text-sm">{member.bio}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28" aria-labelledby="cta-heading">
          <div className="container-page text-center">
            <h2 id="cta-heading" className="heading-section text-foreground mb-6">
              Ready to Begin Your Journey?
            </h2>
            <p className="body-lg text-balance mb-10 max-w-2xl mx-auto">
              Our travel designers are standing by to craft your perfect itinerary.
              Let's start the conversation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="px-10 py-4" asChild>
                <Link href={`/${resolvedParams.tenant}/contact`}>
                  Plan Your Trip
                  <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" className="px-10 py-4" asChild>
                <Link href={`/${resolvedParams.tenant}/explore`}>
                  Browse Destinations
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer tenant={tenant} currentTenantSlug={resolvedParams.tenant} />
    </div>
  );
}