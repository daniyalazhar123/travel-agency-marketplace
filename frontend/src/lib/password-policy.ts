/**
 * Client-safe password policy (mirrors frontend/src/lib/auth.ts + backend/auth.py).
 * Pure functions only — no Node built-ins — importable from client components.
 */

export const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
} as const;

const SPECIAL_RE = /[!@#$%^&*()_+\-=[\]{};:,.<>?/|~]/;
const CONTROL_RE = /[\x00-\x1f\x7f]/;

const BLOCKED = new Set([
  "password",
  "password1",
  "password123",
  "qwerty123456",
  "admin123456",
  "letmein12345",
  "welcome12345",
  "travel2026!!",
]);

export interface PasswordChecklistItem {
  id: string;
  label: string;
  passed: boolean;
}

/** Ordered checklist for real-time signup UI. */
export function passwordChecklist(password: string): PasswordChecklistItem[] {
  return [
    { id: "length", label: `At least ${PASSWORD_POLICY.minLength} characters`, passed: password.length >= PASSWORD_POLICY.minLength },
    { id: "upper", label: "One uppercase letter", passed: /[A-Z]/.test(password) },
    { id: "lower", label: "One lowercase letter", passed: /[a-z]/.test(password) },
    { id: "number", label: "One number", passed: /[0-9]/.test(password) },
    { id: "special", label: "One special character (!@#$%...)", passed: SPECIAL_RE.test(password) },
  ];
}

/** Full validation — returns error strings; empty array = valid. */
export function validatePassword(password: string): string[] {
  const errors: string[] = [];
  if (typeof password !== "string" || password.length === 0) {
    return ["Password is required."];
  }
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters long.`);
  }
  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`Password must be at most ${PASSWORD_POLICY.maxLength} characters long.`);
  }
  if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter.");
  if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter.");
  if (!/[0-9]/.test(password)) errors.push("Password must contain at least one number.");
  if (!SPECIAL_RE.test(password)) errors.push("Password must contain at least one special character.");
  if (CONTROL_RE.test(password)) errors.push("Password contains invalid control characters.");
  if (password.toLowerCase() in BLOCKED) errors.push("This password is too common. Choose something unique.");
  return errors;
}

export function isValidPassword(password: string): boolean {
  return validatePassword(password).length === 0;
}

export function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}
