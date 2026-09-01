import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenantConfig, getAllTenantIds } from "@/lib/tenant/config";
import { Navigation } from "@/components/travel/navigation/Navigation";

interface TenantPageProps {
  params: Promise<{ tenant: string }>;
}

export async function generateStaticParams() {
  return getAllTenantIds().map((id) => ({ tenant: id }));
}

export async function generateMetadata({ params }: TenantPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const tenant = getTenantConfig(resolvedParams.tenant);
  
  if (!tenant) {
    return { title: "Tenant Not Found" };
  }
  
  return {
    title: tenant.name,
    description: tenant.description,
  };
}

interface TenantLayoutProps {
  params: Promise<{ tenant: string }>;
  children: React.ReactNode;
}

export default async function TenantLayout({ params, children }: TenantLayoutProps) {
  const resolvedParams = await params;
  const tenant = getTenantConfig(resolvedParams.tenant);
  
  if (!tenant) {
    notFound();
  }
  
  return (
    <div 
      className="min-h-screen bg-background"
      style={{ '--color-primary': tenant.primaryColor } as React.CSSProperties}
    >
      <Navigation tenant={tenant} currentTenantSlug={resolvedParams.tenant} />
      <main id="main-content" className="pt-20 lg:pt-24">
        {children}
      </main>
    </div>
  );
}
