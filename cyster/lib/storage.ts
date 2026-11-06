import type { DayLog, Focus } from './types';
import type { ChatMode } from './chat';

import { getSessionId } from './auth';

const PREFIX = 'cyster.';
const KEYS = {
  logs: 'cyster.logs',
  focus: 'cyster.focus',
  chat: 'cyster.chat',
  seenBanner: 'cyster.seenBanner',
} as const;

/** Fired on `window` after wipeAll() so mounted components can reset their in-memory state. */
export const WIPE_EVENT = 'cyster:wipe';

/** Keeps each signed-in profile's data under its own key, e.g. cyster.logs.<id>. */
function scoped(base: string): string {
  const id = getSessionId();
  return id ? `${base}.${id}` : base;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (e.g. private mode). Tracking is best-effort.
  }
}

export function getLogs(): DayLog[] {
  return read<DayLog[]>(scoped(KEYS.logs), []);
}

export function setLogs(logs: DayLog[]) {
  write(scoped(KEYS.logs), [...logs].sort((a, b) => a.date.localeCompare(b.date)));
}

export function saveLog(log: DayLog) {
  const logs = getLogs().filter((l) => l.date !== log.date);
  logs.push(log);
  logs.sort((a, b) => a.date.localeCompare(b.date));
  write(scoped(KEYS.logs), logs);
}

export function getFocus(): Focus {
  return read<Focus>(scoped(KEYS.focus), 'general');
}

export function setFocus(focus: Focus) {
  write(scoped(KEYS.focus), focus);
}

/** First-visit privacy banner. A `cyster.*` key, so wipeAll() clears it. */
export function hasSeenBanner(): boolean {
  return read<boolean>(KEYS.seenBanner, false) === true;
}

export function markBannerSeen() {
  write(KEYS.seenBanner, true);
}

/** Persisted chat thread. Attachment bytes are never stored, only their names. */
export type StoredMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: { name: string; mediaType: string }[];
  error?: boolean;
};
export type StoredChat = { messages: StoredMessage[]; mode: ChatMode };

export function getChat(): StoredChat {
  return read<StoredChat>(scoped(KEYS.chat), { messages: [], mode: 'before' });
}

export function saveChat(chat: StoredChat) {
  write(scoped(KEYS.chat), chat);
}

export function wipeAll() {
  if (typeof window === 'undefined') return;
  const toRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(PREFIX)) toRemove.push(key);
  }
  toRemove.forEach((key) => window.localStorage.removeItem(key));
  window.dispatchEvent(new Event(WIPE_EVENT));
}
