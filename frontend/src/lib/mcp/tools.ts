import { z } from "zod";
import { MCPToolDefinition, MCPRequestContext, MCPToolHandler, OperationType, ApprovalRequirement, AuditRequirement } from "./schema";

const SearchInputSchema = z.object({
  query: z.string().min(1).max(500),
  filters: z.object({
    category: z.string().optional(),
    priceRange: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
    duration: z.string().optional(),
    location: z.string().optional(),
    rating: z.number().min(0).max(5).optional(),
  }).optional(),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
});

const HotelSearchInputSchema = z.object({
  destination: z.string().min(1),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(20).default(2),
  rooms: z.number().int().min(1).max(10).default(1),
  filters: z.object({
    starRating: z.number().int().min(1).max(5).optional(),
    amenities: z.array(z.string()).optional(),
    priceRange: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
  }).optional(),
  limit: z.number().int().min(1).max(30).default(15),
});

const FlightSearchInputSchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  passengers: z.number().int().min(1).max(9).default(1),
  cabinClass: z.enum(["economy", "premium", "business", "first"]).default("economy"),
  directOnly: z.boolean().default(false),
  limit: z.number().int().min(1).max(30).default(15),
});

const ExperienceSearchInputSchema = z.object({
  destination: z.string().optional(),
  category: z.string().optional(),
  duration: z.string().optional(),
  difficulty: z.enum(["easy", "moderate", "challenging"]).optional(),
  groupSize: z.number().int().min(1).max(50).optional(),
  priceRange: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
  limit: z.number().int().min(1).max(30).default(15),
});

const CustomerGetInputSchema = z.object({
  customerId: z.string().uuid(),
  includeBookings: z.boolean().default(false),
  includePreferences: z.boolean().default(false),
});

const BookingGetInputSchema = z.object({
  bookingId: z.string().uuid(),
  includeTravelers: z.boolean().default(true),
  includePayments: z.boolean().default(false),
});

const ItineraryGetInputSchema = z.object({
  itineraryId: z.string().uuid(),
  includeDetails: z.boolean().default(true),
});

const ItineraryCreateInputSchema = z.object({
  tenantId: z.string(),
  travelerIds: z.array(z.string().uuid()).min(1).max(10),
  destinations: z.array(z.object({
    destinationId: z.string(),
    arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    activities: z.array(z.string()).optional(),
  })).min(1).max(10),
  preferences: z.object({
    budget: z.number().positive().optional(),
    pace: z.enum(["relaxed", "moderate", "active"]).default("moderate"),
    interests: z.array(z.string()).optional(),
  }).optional(),
});

const BookingCreateInputSchema = z.object({
  itineraryId: z.string().uuid(),
  travelerDetails: z.array(z.object({
    travelerId: z.string().uuid(),
    passportNumber: z.string().optional(),
    specialRequests: z.string().optional(),
  })).min(1).max(10),
  paymentMethodId: z.string().optional(),
  requiresApproval: z.boolean().default(true),
});

const CustomerMessageInputSchema = z.object({
  customerId: z.string().uuid(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  channel: z.enum(["email", "sms", "in-app"]).default("email"),
priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

const BookingCancelInputSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().min(1).max(500),
  refundRequested: z.boolean().default(false),
  requiresApproval: z.boolean().default(true),
});

export type SearchInput = z.infer<typeof SearchInputSchema>;
export type HotelSearchInput = z.infer<typeof HotelSearchInputSchema>;
export type FlightSearchInput = z.infer<typeof FlightSearchInputSchema>;
export type ExperienceSearchInput = z.infer<typeof ExperienceSearchInputSchema>;
export type CustomerGetInput = z.infer<typeof CustomerGetInputSchema>;
export type BookingGetInput = z.infer<typeof BookingGetInputSchema>;
export type ItineraryGetInput = z.infer<typeof ItineraryGetInputSchema>;
export type ItineraryCreateInput = z.infer<typeof ItineraryCreateInputSchema>;
export type BookingCreateInput = z.infer<typeof BookingCreateInputSchema>;
export type CustomerMessageInput = z.infer<typeof CustomerMessageInputSchema>;
export type BookingCancelInput = z.infer<typeof BookingCancelInputSchema>;

export const MCP_TOOL_DEFINITIONS: Record<string, MCPToolDefinition> = {
  "travel.search": {
    name: "travel.search",
    purpose: "Search for travel destinations, packages, and general travel information",
    inputSchema: SearchInputSchema.shape,
    tenantScope: true,
    requiredRole: ["travel-agent", "content-manager", "customer-support"],
    operationType: "read",
    approvalRequirement: "none",
    auditRequirement: "basic",
    providerImplemented: false,
  },
  "hotel.search": {
    name: "hotel.search",
    purpose: "Search for hotel availability and rates",
    inputSchema: HotelSearchInputSchema.shape,
    tenantScope: true,
    requiredRole: ["travel-agent", "booking-agent"],
    operationType: "read",
    approvalRequirement: "none",
    auditRequirement: "basic",
    providerImplemented: false,
  },
  "flight.search": {
    name: "flight.search",
    purpose: "Search for flight availability and fares",
    inputSchema: FlightSearchInputSchema.shape,
    tenantScope: true,
    requiredRole: ["travel-agent", "booking-agent"],
    operationType: "read",
    approvalRequirement: "none",
    auditRequirement: "basic",
    providerImplemented: false,
  },
  "experience.search": {
    name: "experience.search",
    purpose: "Search for curated travel experiences and activities",
    inputSchema: ExperienceSearchInputSchema.shape,
    tenantScope: true,
    requiredRole: ["travel-agent", "content-manager"],
    operationType: "read",
    approvalRequirement: "none",
    auditRequirement: "basic",
    providerImplemented: false,
  },
  "customer.get": {
    name: "customer.get",
    purpose: "Retrieve customer profile and optionally booking history",
    inputSchema: CustomerGetInputSchema.shape,
    tenantScope: true,
    requiredRole: ["travel-agent", "customer-support", "agency-admin"],
    operationType: "read",
    approvalRequirement: "none",
    auditRequirement: "full",
    providerImplemented: false,
  },
  "booking.get": {
    name: "booking.get",
    purpose: "Retrieve booking details with optional traveler and payment information",
    inputSchema: BookingGetInputSchema.shape,
    tenantScope: true,
    requiredRole: ["travel-agent", "customer-support", "booking-agent"],
    operationType: "read",
    approvalRequirement: "none",
    auditRequirement: "full",
    providerImplemented: false,
  },
  "itinerary.get": {
    name: "itinerary.get",
    purpose: "Retrieve itinerary details with optional detailed breakdown",
    inputSchema: ItineraryGetInputSchema.shape,
    tenantScope: true,
    requiredRole: ["travel-agent", "customer-support"],
    operationType: "read",
    approvalRequirement: "none",
    auditRequirement: "basic",
    providerImplemented: false,
  },
  "itinerary.create": {
    name: "itinerary.create",
    purpose: "Create a new travel itinerary draft",
    inputSchema: ItineraryCreateInputSchema.shape,
    tenantScope: true,
    requiredRole: ["travel-agent", "itinerary-designer"],
    operationType: "write",
    approvalRequirement: "policy-check",
    auditRequirement: "full",
    providerImplemented: false,
  },
  "booking.create": {
    name: "booking.create",
    purpose: "Create a booking from an approved itinerary",
    inputSchema: BookingCreateInputSchema.shape,
    tenantScope: true,
    requiredRole: ["booking-agent", "travel-agent"],
    operationType: "sensitive-write",
    approvalRequirement: "human",
    auditRequirement: "full",
    providerImplemented: false,
  },
  "customer.message": {
    name: "customer.message",
    purpose: "Send a message to a customer via email, SMS, or in-app",
    inputSchema: CustomerMessageInputSchema.shape,
    tenantScope: true,
    requiredRole: ["customer-support", "travel-agent", "booking-agent"],
    operationType: "sensitive-write",
    approvalRequirement: "policy-check",
    auditRequirement: "full",
    providerImplemented: false,
  },
  "booking.cancel": {
    name: "booking.cancel",
    purpose: "Cancel an existing booking with optional refund request",
    inputSchema: BookingCancelInputSchema.shape,
    tenantScope: true,
    requiredRole: ["booking-agent", "agency-admin"],
    operationType: "destructive",
    approvalRequirement: "human",
    auditRequirement: "full",
    providerImplemented: false,
  },
};