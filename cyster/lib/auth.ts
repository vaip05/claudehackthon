// Local profiles: a name plus 4-digit PIN, stored on this device only.
// The PIN is hashed with SHA-256. Each profile's data is kept under its own key.

const PROFILES_KEY = 'cyster.profiles';
const SESSION_KEY = 'cyster.session';
export const SESSION_EVENT = 'cyster:session';

type Profile = { id: string; name: string; pinHash: string };
export type AuthResult = { ok: true } | { ok: false; error: string };

const isBrowser = () => typeof window !== 'undefined';

function readProfiles(): Profile[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(window.localStorage.getItem(PROFILES_KEY) ?? '[]') as Profile[];
  } catch {
    return [];
  }
}

function writeProfiles(profiles: Profile[]) {
  window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

async function hashPin(name: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${name.toLowerCase()}:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function setSession(id: string | null) {
  if (id) window.localStorage.setItem(SESSION_KEY, id);
  else window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

/** Id of the signed-in profile, or null. Storage uses it to keep data separate per profile. */
export function getSessionId(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(SESSION_KEY);
}

/** Display name of the signed-in profile, or null. */
export function currentName(): string | null {
  const id = getSessionId();
  return readProfiles().find((p) => p.id === id)?.name ?? null;
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

/** Signs in to an existing profile, or creates one if the name is new. */
export async function signIn(name: string, pin: string): Promise<AuthResult> {
  const cleanName = name.trim();
  if (!cleanName) return { ok: false, error: 'Please enter a name.' };
  if (!/^\d{4}$/.test(pin)) return { ok: false, error: 'Your PIN is 4 digits.' };

  let pinHash: string;
  try {
    pinHash = await hashPin(cleanName, pin);
  } catch {
    // crypto.subtle only exists on https or localhost
    return { ok: false, error: 'Sign-in needs a secure connection (https or localhost).' };
  }

  const profiles = readProfiles();
  const existing = profiles.find((p) => p.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    if (existing.pinHash !== pinHash) return { ok: false, error: "That PIN doesn't match this name." };
    setSession(existing.id);
    return { ok: true };
  }

  const profile: Profile = { id: makeId(), name: cleanName, pinHash };
  writeProfiles([...profiles, profile]);
  setSession(profile.id);
  return { ok: true };
}

/** Signs out. Data stays on the device for the next sign-in. */
export function signOut() {
  setSession(null);
}
