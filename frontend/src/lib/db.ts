/**
 * Neon PostgreSQL connection (server-only).
 *
 * Uses @neondatabase/serverless over HTTP — ideal for Next.js route handlers.
 * SECURITY: never import this file from a client component.
 * All SQL uses parameterized queries ($1, $2, ...) — no string interpolation.
 */
import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let cachedSql: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (cachedSql === null) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not configured in frontend/.env");
    }
    cachedSql = neon(url);
  }
  return cachedSql;
}

/** Execute a single parameterized query. Returns rows as an array. */
export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  const sql = getSql();
  return sql(strings, ...values) as Promise<T[]>;
}

/** Health probe used by route handlers. */
export async function checkDb(): Promise<boolean> {
  try {
    await query`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
