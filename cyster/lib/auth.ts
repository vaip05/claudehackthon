// Local accounts: an email plus a password, stored on this device only.
// There is no server. Nothing here is ever sent anywhere, and a forgotten password can't be recovered
// (the user can use "Delete everything" to start over). Each account's data is kept under its own key
// (see `scoped()` in storage.ts).
//
// Passwords are never stored. We keep a PBKDF2-SHA256 hash with a random per-account salt.

const PROFILES_KEY = 'cyster.profiles';
const SESSION_KEY = 'cyster.session';
export const SESSION_EVENT = 'cyster:session';

export const MIN_PASSWORD_LENGTH = 8;
const PBKDF2_ITERATIONS = 600_000; // OWASP guidance for PBKDF2-HMAC-SHA256

type Profile = { id: string; email: string; salt: string; hash: string; iterations: number };
export type AuthResult = { ok: true } | { ok: false; error: string };

const isBrowser = () => typeof window !== 'undefined';

const normaliseEmail = (email: string) => email.trim().toLowerCase();
const looksLikeEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function readProfiles(): Profile[] {
  if (!isBrowser()) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PROFILES_KEY) ?? '[]') as Partial<Profile>[];
    // Ignore older name+PIN profiles from before email accounts existed.
    return parsed.filter((p): p is Profile => typeof p.email === 'string' && typeof p.hash === 'string');
  } catch {
    return [];
  }
}

function writeProfiles(profiles: Profile[]) {
  window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex: string) =>
  new Uint8Array((hex.match(/.{2}/g) ?? []).map((byte) => parseInt(byte, 16)));

async function derive(password: string, saltHex: string, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex) as BufferSource, iterations },
    key,
    256,
  );
  return toHex(new Uint8Array(bits));
}

function sameHash(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function setSession(id: string | null) {
  if (id) window.localStorage.setItem(SESSION_KEY, id);
  else window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

/** Id of the signed-in account, or null. Storage uses it to keep data separate per account. */
export function getSessionId(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(SESSION_KEY);
}

/** Email of the signed-in account, or null. */
export function currentName(): string | null {
  const id = getSessionId();
  return readProfiles().find((p) => p.id === id)?.email ?? null;
}

/** For useSyncExternalStore: re-runs when the session changes. */
export function subscribeSession(onChange: () => void) {
  window.addEventListener(SESSION_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(SESSION_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

const SECURE_CONTEXT_ERROR = 'Accounts need a secure connection (https or localhost).';

/** Creates a new account on this device and signs in. */
export async function signUp(email: string, password: string, confirm: string): Promise<AuthResult> {
  const cleanEmail = normaliseEmail(email);
  if (!looksLikeEmail(cleanEmail)) return { ok: false, error: 'Please enter a valid email address.' };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Your password needs at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (password !== confirm) return { ok: false, error: "Those passwords don't match." };

  const profiles = readProfiles();
  if (profiles.some((p) => p.email === cleanEmail)) {
    return { ok: false, error: 'An account with this email already exists on this device. Try signing in.' };
  }

  let hash: string;
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  try {
    hash = await derive(password, salt, PBKDF2_ITERATIONS);
  } catch {
    return { ok: false, error: SECURE_CONTEXT_ERROR }; // crypto.subtle only exists on https or localhost
  }

  const profile: Profile = { id: makeId(), email: cleanEmail, salt, hash, iterations: PBKDF2_ITERATIONS };
  writeProfiles([...profiles, profile]);
  setSession(profile.id);
  return { ok: true };
}

/** Signs in to an existing account on this device. */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  const cleanEmail = normaliseEmail(email);
  if (!looksLikeEmail(cleanEmail)) return { ok: false, error: 'Please enter a valid email address.' };
  if (!password) return { ok: false, error: 'Please enter your password.' };

  const profile = readProfiles().find((p) => p.email === cleanEmail);
  if (!profile) {
    return { ok: false, error: 'We couldn\'t find an account for that email on this device. Choose "Create account" to make one.' };
  }

  let hash: string;
  try {
    hash = await derive(password, profile.salt, profile.iterations);
  } catch {
    return { ok: false, error: SECURE_CONTEXT_ERROR };
  }
  if (!sameHash(hash, profile.hash)) return { ok: false, error: "That password doesn't match." };

  setSession(profile.id);
  return { ok: true };
}

/** Signs out. Data stays on the device for the next sign-in. */
export function signOut() {
  setSession(null);
}
