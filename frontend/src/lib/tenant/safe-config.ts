import { getTenantConfig, TenantConfig } from "@/lib/tenant/config";

export interface SafeTenantResult {
  tenant: TenantConfig | null;
  error: Error | null;
}

export async function getSafeTenantConfig(tenantId: string): Promise<SafeTenantResult> {
  try {
    const tenant = getTenantConfig(tenantId);
    if (!tenant) {
      return {
        tenant: null,
        error: new Error(`Tenant not found: ${tenantId}`),
      };
    }
    return { tenant, error: null };
  } catch (error) {
    return {
      tenant: null,
      error: error instanceof Error ? error : new Error("Unknown error fetching tenant config"),
    };
  }
}

export function isValidTenantConfig(config: TenantConfig | null): config is TenantConfig {
  return config !== null && 
    typeof config.id === "string" && 
    config.id.length > 0 &&
    typeof config.name === "string" &&
    config.name.length > 0;
}

export function sanitizeTenantConfig(config: TenantConfig): TenantConfig {
  return {
    id: config.id,
    name: config.name,
    tagline: config.tagline,
    description: config.description,
    logo: config.logo,
    logoDark: config.logoDark,
    favicon: config.favicon,
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    accentColor: config.accentColor,
    typography: config.typography,
    domain: config.domain,
    socialLinks: config.socialLinks?.map(link => ({
      platform: link.platform,
      url: link.url,
      label: link.label,
    })),
    contact: config.contact,
    bookingSettings: config.bookingSettings,
    navigation: config.navigation,
    hero: config.hero,
    destinations: config.destinations?.map(dest => ({
      id: dest.id,
      name: dest.name,
      description: dest.description,
      shortDescription: dest.shortDescription,
      image: dest.image,
      images: dest.images,
      price: dest.price,
      currency: dest.currency,
      duration: dest.duration,
      category: dest.category,
      rating: dest.rating,
      highlights: dest.highlights,
      location: dest.location,
      country: dest.country,
      featured: dest.featured,
      order: dest.order,
    })),
    experiences: config.experiences?.map(exp => ({
      id: exp.id,
      name: exp.name,
      description: exp.description,
      shortDescription: exp.shortDescription,
      image: exp.image,
      category: exp.category,
      duration: exp.duration,
      price: exp.price,
      currency: exp.currency,
      groupSize: exp.groupSize,
      difficulty: exp.difficulty,
      includes: exp.includes,
      excludes: exp.excludes,
      location: exp.location,
      featured: exp.featured,
      order: exp.order,
    })),
    testimonials: config.testimonials,
  };
}

export interface SafeDataResult<T> {
  data: T | null;
  error: Error | null;
}

export function createSafeResult<T>(data: T | null, error: Error | null): SafeDataResult<T> {
  return { data, error };
}

export function isErrorResult<T>(result: SafeDataResult<T>): result is SafeDataResult<T> & { error: Error } {
  return result.error !== null;
}

export function isSuccessResult<T>(result: SafeDataResult<T>): result is SafeDataResult<T> & { data: T } {
  return result.data !== null && result.error === null;
}
