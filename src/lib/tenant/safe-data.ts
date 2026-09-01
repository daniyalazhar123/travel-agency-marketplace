import { getTenantConfig } from "@/lib/tenant/config";

export interface Destination {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  image: string;
  images?: string[];
  price?: number;
  currency?: string;
  duration?: string;
  category?: string;
  rating?: number;
  highlights?: string[];
  location?: {
    city?: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  country?: string;
  featured?: boolean;
  order?: number;
}

export interface Experience {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  image: string;
  category: string;
  duration: string;
  price?: number;
  currency?: string;
  groupSize?: string;
  difficulty?: "easy" | "moderate" | "challenging";
  includes?: string[];
  excludes?: string[];
  location?: {
    city?: string;
    country: string;
  };
  featured?: boolean;
  order?: number;
}

export interface SafeDestinationsResult {
  data: { id: string; name: string; description: string; shortDescription?: string; image: string; images?: string[]; price?: number; currency?: string; duration?: string; category?: string; rating?: number; highlights?: string[]; location?: { city?: string; country: string; coordinates?: { lat: number; lng: number } }; country?: string; featured?: boolean; order?: number }[] | null;
  error: Error | null;
}

export function getSafeDestinations(tenantId: string): { data: { id: string; name: string; description: string; shortDescription?: string; image: string; images?: string[]; price?: number; currency?: string; duration?: string; category?: string; rating?: number; highlights?: string[]; location?: { city?: string; country: string; coordinates?: { lat: number; lng: number } }; country?: string; featured?: boolean; order?: number }[] | null; error: Error | null } {
  try {
    const tenant = getTenantConfig(tenantId);
    
    if (!tenant) {
      return { data: null, error: new Error(`Tenant not found: ${tenantId}`) };
    }
    
    const destinations = tenant.destinations ?? [];
    return { data: destinations, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error("Unknown error fetching destinations") 
    };
  }
}

export function getSafeExperiences(tenantId: string): { data: { id: string; name: string; description: string; shortDescription?: string; image: string; category: string; duration: string; price?: number; currency?: string; groupSize?: string; difficulty?: "easy" | "moderate" | "challenging"; includes?: string[]; excludes?: string[]; location?: { city?: string; country: string }; featured?: boolean; order?: number }[] | null; error: Error | null } {
  try {
    const tenant = getTenantConfig(tenantId);
    
    if (!tenant) {
      return { data: null, error: new Error(`Tenant not found: ${tenantId}`) };
    }
    
    const experiences = tenant.experiences ?? [];
    return { data: experiences, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error("Unknown error fetching experiences") 
    };
  }
}

export function getSafeDestination(tenantId: string, destinationId: string): { data: { id: string; name: string; description: string; shortDescription?: string; image: string; images?: string[]; price?: number; currency?: string; duration?: string; category?: string; rating?: number; highlights?: string[]; location?: { city?: string; country: string; coordinates?: { lat: number; lng: number } }; country?: string; featured?: boolean; order?: number } | null; error: Error | null } {
  try {
    const tenant = getTenantConfig(tenantId);
    
    if (!tenant) {
      return { data: null, error: new Error(`Tenant not found: ${tenantId}`) };
    }
    
    const destination = (tenant.destinations ?? []).find((d: { id: string }) => d.id === destinationId) ?? null;
    return { data: destination, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error("Unknown error fetching destination") 
    };
  }
}

export function getSafeExperience(tenantId: string, experienceId: string): { data: { id: string; name: string; description: string; shortDescription?: string; image: string; category: string; duration: string; price?: number; currency?: string; groupSize?: string; difficulty?: "easy" | "moderate" | "challenging"; includes?: string[]; excludes?: string[]; location?: { city?: string; country: string }; featured?: boolean; order?: number } | null; error: Error | null } {
  try {
    const tenant = getTenantConfig(tenantId);
    
    if (!tenant) {
      return { data: null, error: new Error(`Tenant not found: ${tenantId}`) };
    }
    
    const experience = (tenant.experiences ?? []).find((e: { id: string }) => e.id === experienceId) ?? null;
    return { data: experience, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error("Unknown error fetching experience") 
    };
  }
}