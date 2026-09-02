/**
 * Booking request validation (mirrors backend/models.py Booking + BookingType).
 * Shared by the API route; safe to import client-side for pre-submit validation.
 */
import { z } from "zod";

export const BookingTypeSchema = z.enum(["experience", "stay", "flight"]);

export const BookingRequestSchema = z.object({
  tenantId: z
    .string()
    .trim()
    .min(1, "Tenant is required.")
    .max(64)
    .regex(/^[a-z0-9-]+$/i, "Invalid tenant id."),
  bookingType: BookingTypeSchema,

  // Contact (lead can exist without a user account)
  fullName: z.string().trim().min(2, "Full name is required.").max(200),
  email: z.email("A valid email is required.").max(320).toLowerCase(),
  phone: z
    .string()
    .trim()
    .max(32)
    .regex(/^[+0-9()\-\s]*$/, "Invalid phone number.")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  // Travel details
  destination: z.string().trim().max(200).optional().or(z.literal("").transform(() => undefined)),
  travelers: z.coerce.number().int().min(1, "At least 1 traveler.").max(20),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD.")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  // Free-form search context (which tab / filters were used)
  category: z.string().trim().max(100).optional().or(z.literal("").transform(() => undefined)),
  notes: z
    .string()
    .trim()
    .max(2000, "Notes are limited to 2000 characters.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type BookingRequest = z.infer<typeof BookingRequestSchema>;

/** Cross-field rule: end date must be after start date when both are set. */
export function validateDateOrder(data: BookingRequest): string | null {
  if (data.startDate && data.endDate && data.endDate <= data.startDate) {
    return "End date must be after the start date.";
  }
  return null;
}
