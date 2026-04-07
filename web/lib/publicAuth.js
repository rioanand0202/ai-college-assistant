import { jwtDecode } from "jwt-decode";

export const PUBLIC_TOKEN_KEY = "publicAccessToken";
export const PUBLIC_USER_KEY = "publicUser";

const GUEST_MESSAGES_KEY = "aca_public_chat_guest_v1";

export function getPublicToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PUBLIC_TOKEN_KEY)?.trim() || null;
}

export function getPublicUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PUBLIC_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setPublicSession(token, user) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(PUBLIC_TOKEN_KEY, token);
  else localStorage.removeItem(PUBLIC_TOKEN_KEY);
  if (user) localStorage.setItem(PUBLIC_USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(PUBLIC_USER_KEY);
}

export function clearPublicSession() {
  setPublicSession(null, null);
}

/** Hydrate minimal user from JWT claims (display only). */
export function userFromPublicToken(token) {
  if (!token) return null;
  try {
    const p = jwtDecode(token);
    return {
      id: p.sub,
      email: p.email,
      name: p.name,
      provider: p.authKind === "oauth" ? "google" : undefined,
    };
  } catch {
    return null;
  }
}

export function loadGuestMessages() {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(GUEST_MESSAGES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveGuestMessages(messages) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(GUEST_MESSAGES_KEY, JSON.stringify(messages));
}

export function clearGuestMessages() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(GUEST_MESSAGES_KEY);
}
