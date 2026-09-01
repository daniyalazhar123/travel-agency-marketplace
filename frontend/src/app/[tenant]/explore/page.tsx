import { Metadata } from "next";
import { getTenantConfig } from "@/lib/tenant/config";
import { Hero } from "@/components/travel/hero/Hero";
import { FeaturedDestinations } from "@/components/travel/destinations/FeaturedDestinations";
import { CuratedExperiences } from "@/components/travel/experiences/CuratedExperiences";
import { EditorialTravel } from "@/components/travel/editorial/EditorialTravel";
import { PremiumCTA } from "@/components/travel/cta/PremiumCTA";
import { Footer } from "@/components/travel/footer/Footer";

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
    title: `Explore - ${tenant.name}`,
    description: tenant.description,
  };
}

export default async function TenantExplorePage({ params }: TenantPageProps) {
  const resolvedParams = await params;
  const tenant = getTenantConfig(resolvedParams.tenant);
  
  if (!tenant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main>
        <Hero tenant={tenant} currentTenantSlug={resolvedParams.tenant} />
        <FeaturedDestinations
          destinations={tenant.destinations ?? []}
          title="Destinations"
          subtitle="Discover our hand-selected collection of extraordinary destinations worldwide"
          viewAllLabel="View All Destinations"
          currentTenantSlug={resolvedParams.tenant}
        />
        <CuratedExperiences
          experiences={tenant.experiences ?? []}
          title="Featured Experiences"
          subtitle="Extraordinary moments crafted for those who seek the exceptional"
          viewAllLabel="View All Experiences"
          currentTenantSlug={resolvedParams.tenant}
        />
        <EditorialTravel
          articles={[]}
          title="Travel Journal"
          subtitle="Stories, guides, and insights from the world's most extraordinary places"
          viewAllLabel="Read All Stories"
          currentTenantSlug={resolvedParams.tenant}
        />
        <PremiumCTA
          currentTenantSlug={resolvedParams.tenant}
          title="Ready to explore the extraordinary?"
          subtitle="Our travel designers are ready to craft your perfect journey."
          primaryCTA={{ label: "Start Planning", href: "/booking" }}
          secondaryCTA={{ label: "Browse Destinations", href: "/explore" }}
        />
        <Footer tenant={tenant} currentTenantSlug={resolvedParams.tenant} />
      </main>
    </div>
  );
}
