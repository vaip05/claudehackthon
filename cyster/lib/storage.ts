import type { DayLog, Focus } from './types';
import type { ChatMode } from './chat';

const PREFIX = 'cyster.';
const KEYS = {
  logs: 'cyster.logs',
  focus: 'cyster.focus',
  chat: 'cyster.chat',
} as const;

/** Fired on `window` after wipeAll() so mounted components can reset their in-memory state. */
export const WIPE_EVENT = 'cyster:wipe';

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
  return read<DayLog[]>(KEYS.logs, []);
}

export function saveLog(log: DayLog) {
  const logs = getLogs().filter((l) => l.date !== log.date);
  logs.push(log);
  logs.sort((a, b) => a.date.localeCompare(b.date));
  write(KEYS.logs, logs);
}

export function getFocus(): Focus {
  return read<Focus>(KEYS.focus, 'general');
}

export function setFocus(focus: Focus) {
  write(KEYS.focus, focus);
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
  return read<StoredChat>(KEYS.chat, { messages: [], mode: 'before' });
}

export function saveChat(chat: StoredChat) {
  write(KEYS.chat, chat);
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
