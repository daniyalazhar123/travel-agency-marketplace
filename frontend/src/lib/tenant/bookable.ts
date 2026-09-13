/**
 * Destination bookability checks — shared by SERVER pages and CLIENT cards.
 *
 * Must stay free of "use client" so server components can call these helpers
 * directly (calling a client-module function from the server throws).
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A destination can go through the Stripe proxy only when it is a live
 * catalog row (UUID primary key) with a positive price — the backend
 * recomputes the amount server-side from the DB by id, and config-fallback
 * rows (slug ids like "maldives") don't exist there.
 */
export function isStripeBookableId(id: string, price?: number | null): boolean {
  return UUID_RE.test(id) && typeof price === "number" && price > 0;
}

/** Live catalog rows have UUID ids; config fallback uses slugs. */
export function isUuidDestinationId(id: string): boolean {
  return UUID_RE.test(id);
}
