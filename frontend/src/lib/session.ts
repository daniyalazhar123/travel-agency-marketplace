"use client";

/**
 * Client-side session helpers (JWT in localStorage — demo-scope transport).
 * For production hardening, migrate to backend-set httpOnly cookies.
 *
 * "Remember me": when enabled, the session is mirrored to sessionStorage with
 * a flag — closing the tab ends it (default). When disabled, the token lives
 * only in memory for the tab (still localStorage for the active session so
 * refreshes within the tab keep working, but cleared on tab close via the
 * bootstrap below). Simpler + honest: default = persists, remember = persists
 * across tabs (sessionStorage sync), opt-out = cleared on unload.
 */

const TOKEN_KEY = "access_token";
const USER_KEY = "user_info";

export interface SessionUser {
  id: string;
  email: string;
  role: string;
  tenant_id: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    // localStorage first (remembered), sessionStorage second (this tab only)
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSession(token: string, user: SessionUser, remember = true): void {
  try {
    const store = remember ? localStorage : sessionStorage;
    store.setItem(TOKEN_KEY, token);
    store.setItem(USER_KEY, JSON.stringify(user));
    // Always purge the other store so switching modes can't leave a ghost
    (remember ? sessionStorage : localStorage).removeItem(TOKEN_KEY);
    (remember ? sessionStorage : localStorage).removeItem(USER_KEY);
  } catch {
    // Storage blocked — session lives only in memory
  }
}

export function getSessionUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

/**
 * Server-side token validation via the backend.
 * Returns the session user, or null if token is invalid/expired.
 */
export async function validateToken(token: string): Promise<SessionUser | null> {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "https://8d037e55-ee42-46aa-9371-a36de024c7dd-00-2m01srlp9rho5.pike.replit.dev";
  try {
    const res = await fetch(`${base}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as SessionUser;
    return json ?? null;
  } catch {
    return null;
  }
}
