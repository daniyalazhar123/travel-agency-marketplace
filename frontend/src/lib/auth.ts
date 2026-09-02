import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync: (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options?: { N: number; r: number; p: number }
) => Promise<Buffer> = promisify(scrypt) as never;

/**
 * SCrypt password hashing (no external deps, Node built-in).
 * Format: scrypt$N$r$p$salt$hash (salt = 16 bytes hex, hash = 64 bytes hex)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt$16384$8$1$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, N, r, p, saltHex, hashHex] = stored.split("$");
    if (scheme !== "scrypt") return false;
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const keylen = expected.length;
    const derived = await scryptAsync(password, salt, keylen, {
      N: parseInt(N, 10),
      r: parseInt(r, 10),
      p: parseInt(p, 10),
    });
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/**
 * Server-side password policy:
 * - Min 12 chars
 * - 1 uppercase, 1 lowercase, 1 number, 1 special char
 * - Max 128 (DoS guard)
 * - No control/whitespace-only tricks
 */
export const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  specialChars: "!@#$%^&*()_+-=[]{};:,.<>?/|~",
};

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  if (typeof password !== "string" || password.length === 0) {
    return { valid: false, errors: ["Password is required."] };
  }
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters long.`);
  }
  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`Password must be at most ${PASSWORD_POLICY.maxLength} characters long.`);
  }
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter.");
  }
  if (PASSWORD_POLICY.requireNumber && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number.");
  }
  if (
    PASSWORD_POLICY.requireSpecial &&
    !new RegExp(`[${PASSWORD_POLICY.specialChars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]`).test(password)
  ) {
    errors.push(
      `Password must contain at least one special character (${PASSWORD_POLICY.specialChars}).`
    );
  }
  // Reject control characters (null bytes, newlines smuggled in)
  if (/[\x00-\x1f\x7f]/.test(password)) {
    errors.push("Password contains invalid control characters.");
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Constant-time comparison for secrets/tokens (auth flows).
 */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(createHash("sha256").update(a).digest());
  const bufB = Buffer.from(createHash("sha256").update(b).digest());
  return timingSafeEqual(bufA, bufB);
}

/**
 * Common/breached password blocklist (extendable).
 */
const BLOCKED_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "qwerty123456",
  "admin123456",
  "letmein12345",
  "welcome12345",
  "travel2026!!",
]);

export function isCommonPassword(password: string): boolean {
  return BLOCKED_PASSWORDS.has(password.toLowerCase());
}

/**
 * Full check: policy + blocklist. Use in signup/reset handlers.
 */
export function validateNewPassword(password: string): PasswordValidationResult {
  const result = validatePassword(password);
  if (result.valid && isCommonPassword(password)) {
    return { valid: false, errors: ["This password is too common. Choose something unique."] };
  }
  return result;
}
