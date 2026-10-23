export interface TenantConfig {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  logo?: string;
  logoDark?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  typography?: {
    display?: string;
    body?: string;
  };
  domain?: string;
  socialLinks?: SocialLink[];
  contact?: ContactInfo;
  bookingSettings?: BookingSettings;
  navigation?: NavigationConfig;
  hero?: HeroConfig;
  destinations?: Destination[];
  experiences?: Experience[];
  testimonials?: Testimonial[];
}

export interface SocialLink {
  platform: "instagram" | "facebook" | "twitter" | "linkedin" | "youtube" | "pinterest";
  url: string;
  label?: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  hours?: string;
}

export interface BookingSettings {
  enabled: boolean;
  defaultTab?: "flights" | "stays" | "experiences";
  ctaLabel?: string;
  searchPlaceholder?: string;
}

export interface NavigationConfig {
  items: NavigationItem[];
  cta?: NavigationCTA;
}

export interface NavigationItem {
  label: string;
  href: string;
  children?: NavigationItem[];
}

export interface NavigationCTA {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "accent";
}

export interface HeroConfig {
  headline: string;
  subheadline?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  primaryCTA?: HeroCTA;
  secondaryCTA?: HeroCTA;
  overlayOpacity?: number;
}

export interface HeroCTA {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "accent" | "ghost";
}

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

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  authorRole?: string;
  authorImage?: string;
  destination?: string;
  rating?: number;
  date?: string;
}

const demoDestinations: Destination[] = [
  {
    id: "amalfi",
    name: "Amalfi Coast",
    description: "Cliffside villages cascading into azure Mediterranean waters",
    shortDescription: "Italy's most enchanting coastline",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80",
    country: "Italy",
    price: 4500,
    currency: "USD",
    duration: "7 nights",
    category: "Coastal Luxury",
    rating: 4.9,
    highlights: ["Private boat tours", "Michelin dining", "Lemon grove visits"],
    featured: true,
    order: 1,
  },
  {
    id: "kyoto",
    name: "Kyoto",
    description: "Ancient temples and serene gardens in Japan's cultural heart",
    shortDescription: "Timeless elegance in every season",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80",
    country: "Japan",
    price: 6200,
    currency: "USD",
    duration: "6 nights",
    category: "Cultural Journey",
    rating: 4.8,
    highlights: ["Tea ceremony", "Bamboo forest", "Temple stays"],
    featured: true,
    order: 2,
  },
  {
    id: "santorini",
    name: "Santorini",
    description: "Iconic white architecture and legendary sunsets over the caldera",
    shortDescription: "Aegean perfection",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=80",
    country: "Greece",
    price: 3800,
    currency: "USD",
    duration: "5 nights",
    category: "Island Escape",
    rating: 4.9,
    highlights: ["Sunset sailing", "Wine tasting", "Volcano hike"],
    featured: false,
    order: 3,
  },
  {
    id: "bora-bora",
    name: "Bora Bora",
    description: "Overwater bungalows above crystal-clear lagoons",
    shortDescription: "Paradise found in French Polynesia",
    image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80",
    country: "French Polynesia",
    price: 8900,
    currency: "USD",
    duration: "7 nights",
    category: "Ultimate Luxury",
    rating: 5.0,
    highlights: ["Shark feeding", "Lagoon spa", "Private motu dinner"],
    featured: true,
    order: 4,
  },
  {
    id: "maldives",
    name: "Maldives",
    description: "Pristine atolls with world-class marine life",
    shortDescription: "Indian Ocean sanctuary",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80",
    country: "Maldives",
    price: 7200,
    currency: "USD",
    duration: "6 nights",
    category: "Island Escape",
    rating: 4.9,
    highlights: ["Underwater dining", "Manta ray snorkeling", "Dolphin cruise"],
    featured: false,
    order: 5,
  },
  {
    id: "marrakech",
    name: "Marrakech",
    description: "Vibrant souks and palatial riads in the Red City",
    shortDescription: "Moroccan mystery and majesty",
    image: "https://images.unsplash.com/photo-1582718968968-7b3b2a1c7d9d?w=1200&q=80",
    country: "Morocco",
    price: 3200,
    currency: "USD",
    duration: "5 nights",
    category: "Cultural Journey",
    rating: 4.7,
    highlights: ["Desert camp", "Cooking class", "Hammam spa"],
    featured: false,
    order: 6,
  },
];

const demoExperiences: Experience[] = [
  {
    id: "private-yacht-amalfi",
    name: "Private Yacht Charter: Amalfi Coast",
    description: "Sail the stunning Amalfi coastline aboard a luxury yacht with private chef and sommelier. Visit hidden coves, dine at waterfront Michelin restaurants, and sleep under the stars.",
    shortDescription: "Exclusive Mediterranean sailing experience",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
    category: "Private Escapes",
    duration: "Full day",
    price: 3500,
    currency: "USD",
    groupSize: "Up to 8 guests",
    difficulty: "easy",
    includes: ["Private yacht & crew", "Gourmet meals", "Wine pairings", "Snorkeling gear", "Hotel transfers"],
    location: { country: "Italy", city: "Amalfi" },
    featured: true,
    order: 1,
  },
  {
    id: "kyoto-tea-ceremony",
    name: "Private Tea Ceremony with Geisha",
    description: "Experience an authentic tea ceremony in a historic Kyoto machiya with a geisha. Learn the ancient rituals of matcha preparation and seasonal kaiseki cuisine.",
    shortDescription: "Intimate cultural immersion in Kyoto",
    image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80",
    category: "Cultural Journeys",
    duration: "3 hours",
    price: 850,
    currency: "USD",
    groupSize: "Up to 4 guests",
    difficulty: "easy",
    includes: ["Private tea ceremony", "Kaiseki tasting", "Geisha performance", "Historic venue", "Translation"],
    location: { country: "Japan", city: "Kyoto" },
    featured: true,
    order: 2,
  },
  {
    id: "maldives-underwater-dining",
    name: "Underwater Dining Experience",
    description: "Dine 5 meters beneath the Indian Ocean in an all-glass underwater restaurant. Watch manta rays and sharks glide past while enjoying a multi-course tasting menu.",
    shortDescription: "Dining surrounded by marine life",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
    category: "Island Retreats",
    duration: "2.5 hours",
    price: 650,
    currency: "USD",
    groupSize: "Up to 2 guests",
    difficulty: "easy",
    includes: ["Underwater restaurant", "Tasting menu", "Wine pairing", "Marine biologist guide", "Seaplane transfer"],
    location: { country: "Maldives" },
    featured: false,
    order: 3,
  },
  {
    id: "patagonia-trekking",
    name: "Patagonia Luxury Trekking",
    description: "Explore Torres del Paine with expert guides, staying in exclusive eco-domes with panoramic glacier views. Helicopter access to remote trails included.",
    shortDescription: "Adventure meets luxury in Patagonia",
    image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80",
    category: "Adventure",
    duration: "5 days / 4 nights",
    price: 8900,
    currency: "USD",
    groupSize: "Up to 6 guests",
    difficulty: "moderate",
    includes: ["Eco-dome accommodation", "Helicopter transfers", "Expert guides", "All meals", "Park permits", "Equipment"],
    location: { country: "Chile", city: "Torres del Paine" },
    featured: false,
    order: 4,
  },
  {
    id: "bali-wellness-retreat",
    name: "Balinese Wellness Sanctuary",
    description: "A transformative wellness journey in Ubud's jungles. Daily yoga, traditional healing, spa treatments, and plant-based cuisine in a private villa setting.",
    shortDescription: "Holistic renewal in Bali",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
    category: "Wellness",
    duration: "7 days / 6 nights",
    price: 4200,
    currency: "USD",
    groupSize: "Solo or couple",
    difficulty: "easy",
    includes: ["Private villa", "Daily yoga & meditation", "Spa treatments", "Healing sessions", "Organic meals", "Airport transfers"],
    location: { country: "Indonesia", city: "Ubud" },
    featured: true,
    order: 5,
  },
  {
    id: "safari-botswana",
    name: "Okavango Delta Safari",
    description: "Private mobile safari through the Okavango Delta. Luxury tented camps, expert trackers, mokoro canoe excursions, and night drives in one of Africa's last true wildernesses.",
    shortDescription: "Ultimate African safari experience",
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&q=80",
    category: "Adventure",
    duration: "8 days / 7 nights",
    price: 12500,
    currency: "USD",
    groupSize: "Up to 4 guests",
    difficulty: "moderate",
    includes: ["Luxury tented camps", "Private guide & vehicle", "Mokoro excursions", "All meals & drinks", "Park fees", "Internal flights"],
    location: { country: "Botswana", city: "Okavango Delta" },
    featured: false,
    order: 6,
  },
];

const demoTenantConfig: TenantConfig = {
  id: "demo",
  name: "Wanderlust Travel Co.",
  tagline: "Curated luxury journeys worldwide",
  description: "Discover extraordinary destinations with personalized service. We craft bespoke itineraries for discerning travelers seeking authentic luxury experiences.",
  primaryColor: "#1C1917",
  secondaryColor: "#44403C",
  accentColor: "#A16207",
  socialLinks: [
    { platform: "instagram", url: "https://instagram.com", label: "Instagram" },
    { platform: "facebook", url: "https://facebook.com", label: "Facebook" },
    { platform: "twitter", url: "https://twitter.com", label: "Twitter" },
    { platform: "youtube", url: "https://youtube.com", label: "YouTube" },
  ],
  contact: {
    email: "hello@wanderlust.example.com",
    phone: "+1 (555) 012-3456",
    address: "123 Luxury Lane, New York, NY 10001",
    hours: "Mon-Fri 9am-6pm EST",
  },
  bookingSettings: {
    enabled: true,
    defaultTab: "experiences",
    ctaLabel: "Start Your Journey",
  },
  navigation: {
    items: [
      { label: "Explore", href: "/explore" },
      { label: "Destinations", href: "/destinations" },
      { label: "Experiences", href: "/experiences" },
      { label: "About", href: "/about" },
      { label: "Journal", href: "/journal" },
    ],
    cta: {
      label: "Plan Your Trip",
      href: "/booking",
      variant: "primary",
    },
  },
  hero: {
    headline: "Your next extraordinary journey begins here",
    subheadline: "Curated luxury experiences for the discerning traveler",
    backgroundImage: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=2400&q=80",
    primaryCTA: {
      label: "Explore Destinations",
      href: "/explore",
      variant: "primary",
    },
    secondaryCTA: {
      label: "View Experiences",
      href: "/experiences",
      variant: "secondary",
    },
    overlayOpacity: 0.4,
  },
  destinations: demoDestinations,
  experiences: demoExperiences,
  testimonials: [],
};

const defaultTenantConfig: TenantConfig = {
  id: "default",
  name: "Travel Agency",
  tagline: "Curated journeys worldwide",
  description: "Discover extraordinary destinations with personalized service.",
  primaryColor: "#1C1917",
  secondaryColor: "#44403C",
  accentColor: "#A16207",
  socialLinks: [],
  contact: {},
  bookingSettings: {
    enabled: true,
    defaultTab: "experiences",
    ctaLabel: "Start Your Journey",
  },
  navigation: {
    items: [
      { label: "Explore", href: "/explore" },
      { label: "Destinations", href: "/destinations" },
      { label: "Experiences", href: "/experiences" },
      { label: "About", href: "/about" },
    ],
    cta: {
      label: "Plan Your Trip",
      href: "/booking",
      variant: "primary",
    },
  },
  hero: {
    headline: "Your next extraordinary journey begins here",
    subheadline: "Curated luxury experiences for the discerning traveler",
    primaryCTA: {
      label: "Explore Destinations",
      href: "/explore",
      variant: "primary",
    },
    secondaryCTA: {
      label: "View Experiences",
      href: "/experiences",
      variant: "secondary",
    },
  },
  destinations: [],
  experiences: [],
  testimonials: [],
};

const tenantRegistry: Record<string, TenantConfig> = {
  demo: demoTenantConfig,
  default: defaultTenantConfig,
};

export function getTenantConfig(tenantId: string): TenantConfig | null {
  return tenantRegistry[tenantId] || null;
}

export function getAllTenantIds(): string[] {
  return Object.keys(tenantRegistry);
}

export { demoTenantConfig, defaultTenantConfig };
