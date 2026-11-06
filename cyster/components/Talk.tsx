'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Markdown from '@/components/Markdown';
import {
  DOCTOR_BRIEF_PROMPT,
  MAX_ATTACHMENTS_PER_MESSAGE,
  MAX_ATTACHMENT_BYTES,
  isAllowedMediaType,
  type AttachmentMediaType,
  type ChatMode,
  type WireMessage,
} from '@/lib/chat';
import { streamChat } from '@/lib/chatClient';
import { cycleSummary } from '@/lib/cycle';
import { WIPE_EVENT, getChat, getLogs, saveChat } from '@/lib/storage';

type UiAttachment = { name: string; mediaType: string; data?: string };
type UiMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: UiAttachment[];
  error?: boolean;
};
type PendingFile = { name: string; mediaType: AttachmentMediaType; data: string };
type Brief = { open: boolean; loading: boolean; text: string; error: string | null };

const CLOSED_BRIEF: Brief = { open: false, loading: false, text: '', error: null };
const FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png';

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function mediaTypeFor(file: File): AttachmentMediaType | null {
  const name = file.name.toLowerCase();
  if (isAllowedMediaType(file.type)) return file.type;
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.png')) return 'image/png';
  return null;
}

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

/** Messages that should be sent to the model: skips error bubbles and empty placeholders. */
function toWire(messages: UiMessage[]): WireMessage[] {
  return messages
    .filter((m) => !m.error && (m.content.trim() || m.attachments?.some((a) => a.data)))
    .map((m) => {
      const attachments = (m.attachments ?? [])
        .filter(
          (a): a is UiAttachment & { data: string; mediaType: AttachmentMediaType } =>
            !!a.data && isAllowedMediaType(a.mediaType),
        )
        .map((a) => ({ name: a.name, mediaType: a.mediaType, data: a.data }));
      return { role: m.role, content: m.content, ...(attachments.length ? { attachments } : {}) };
    });
}

const STARTERS = [
  'My periods are really irregular',
  'My period pain is intense',
  'I have acne and extra hair growth',
  'Sex or bowel movements hurt',
  "I have a lab report I don't understand",
];

type IconProps = { className?: string };
const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

function SendIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
function ClipIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="m21 11.5-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l7.9-7.9" />
    </svg>
  );
}
function LockIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
function DocIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}
function SparkleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 2c.4 4.6 2.4 8 8 10-5.6 2-7.6 5.4-8 10-.4-4.6-2.4-8-8-10 5.6-2 7.6-5.4 8-10z" />
    </svg>
  );
}

function FileChip({ name, onRemove }: { name: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3 py-1 text-xs text-violet-900">
      <DocIcon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="ml-1 text-violet-400 hover:text-violet-700"
        >
          ✕
        </button>
      )}
    </span>
  );
}

export default function Talk() {
  const searchParams = useSearchParams();
  const prefill = searchParams.get('q');

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [mode, setMode] = useState<ChatMode>('before');
  const [input, setInput] = useState(prefill ?? '');
  const [appliedPrefill, setAppliedPrefill] = useState(prefill);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [brief, setBrief] = useState<Brief>(CLOSED_BRIEF);
  const [hydrated, setHydrated] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load the saved thread from localStorage (client only, so it can't mismatch the server render).
  useEffect(() => {
    const saved = getChat();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from an external store (localStorage) */
    setMessages(saved.messages);
    setMode(saved.mode === 'after' ? 'after' : 'before');
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Pre-fill the input from ?q= (links from Tips and insight cards). The initial value is
  // set in useState above; this handles ?q= changing while the page is already mounted.
  if (prefill !== appliedPrefill) {
    setAppliedPrefill(prefill);
    if (prefill) setInput(prefill);
  }
  useEffect(() => {
    if (prefill) textareaRef.current?.focus();
  }, [prefill]);

  // Persist the thread to cyster.chat. Skipped mid-stream; saved again once the reply finishes.
  useEffect(() => {
    if (!hydrated || streaming) return;
    saveChat({
      mode,
      messages: messages.map(({ attachments, ...m }) => ({
        ...m,
        ...(attachments ? { attachments: attachments.map(({ name, mediaType }) => ({ name, mediaType })) } : {}),
      })),
    });
  }, [messages, mode, streaming, hydrated]);

  // "Delete everything" resets the in-memory thread too.
  useEffect(() => {
    const reset = () => {
      abortRef.current?.abort();
      setMessages([]);
      setMode('before');
      setInput('');
      setPending([]);
      setFileError(null);
      setStreaming(false);
      setBrief(CLOSED_BRIEF);
    };
    window.addEventListener(WIPE_EVENT, reset);
    return () => window.removeEventListener(WIPE_EVENT, reset);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, brief.open]);

  // Auto-grow the textarea.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    el.style.overflowY = el.scrollHeight > 140 ? 'auto' : 'hidden';
  }, [input]);

  const addFiles = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ''; // allow re-selecting the same file
    if (files.length === 0) return;

    setFileError(null);
    const added: PendingFile[] = [];
    for (const file of files) {
      const mediaType = mediaTypeFor(file);
      if (!mediaType) {
        setFileError(`"${file.name}" isn't supported. Please attach a PDF, JPG, or PNG.`);
        continue;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setFileError(`"${file.name}" is over 5 MB. Please attach a smaller file.`);
        continue;
      }
      try {
        added.push({ name: file.name, mediaType, data: await readBase64(file) });
      } catch {
        setFileError(`I couldn't read "${file.name}". Please try again.`);
      }
    }
    setPending((prev) => {
      const next = [...prev, ...added];
      if (next.length > MAX_ATTACHMENTS_PER_MESSAGE) {
        setFileError(`You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files at a time.`);
      }
      return next.slice(0, MAX_ATTACHMENTS_PER_MESSAGE);
    });
  }, []);

  async function send(override?: string) {
    const text = (override ?? input).trim();
    if ((!text && pending.length === 0) || streaming) return;

    const userMessage: UiMessage = {
      id: newId(),
      role: 'user',
      content: text,
      ...(pending.length ? { attachments: pending } : {}),
    };
    const assistantId = newId();
    const history = [...messages, userMessage];

    setMessages([...history, { id: assistantId, role: 'assistant', content: '' }]);
    setInput('');
    setPending([]);
    setFileError(null);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let received = false;

    try {
      await streamChat({
        messages: toWire(history),
        mode,
        cycleSummary: cycleSummary(getLogs()), // tracker context for the agent
        signal: controller.signal,
        onText: (chunk) => {
          received = true;
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)));
        },
      });
      if (!received) throw new Error("I didn't get a reply that time. Please try again.");
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : 'Sorry, something went wrong. Please try again.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: m.content ? `${m.content}\n\n${message}` : message, error: true } : m,
        ),
      );
    } finally {
      if (abortRef.current === controller) {
        setStreaming(false);
        abortRef.current = null;
      }
    }
  }

  async function makeBrief() {
    if (streaming || brief.loading) return;

    const summary = cycleSummary(getLogs());
    const hasThread = messages.some((m) => m.role === 'user' && !m.error);
    if (!hasThread && !summary) {
      setBrief({
        open: true,
        loading: false,
        text: '',
        error:
          'Tell me a bit about what you\u2019ve been experiencing (or log a few days in the tracker) and I can put a brief together for you.',
      });
      return;
    }

    setBrief({ open: true, loading: true, text: '', error: null });
    const controller = new AbortController();
    abortRef.current = controller;
    const wire: WireMessage[] = [...toWire(messages), { role: 'user', content: DOCTOR_BRIEF_PROMPT }];

    try {
      await streamChat({
        messages: wire,
        mode,
        cycleSummary: summary,
        signal: controller.signal,
        onText: (chunk) => setBrief((b) => ({ ...b, text: b.text + chunk })),
      });
      setBrief((b) => ({ ...b, loading: false }));
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : 'Sorry, something went wrong. Please try again.';
      setBrief((b) => ({ ...b, loading: false, error: message }));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  function closeBrief() {
    if (brief.loading) abortRef.current?.abort();
    setBrief(CLOSED_BRIEF);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  }

  const canSend = !streaming && (input.trim().length > 0 || pending.length > 0);
  const toggleMode = () => setMode((m) => (m === 'after' ? 'before' : 'after'));

  return (
    <>
      {/* Chat UI: hidden when printing so only the doctor brief panel is printed. */}
      <div className="no-print relative flex flex-1 flex-col overflow-x-clip bg-linear-to-b from-rose-50 via-fuchsia-50 to-violet-50 text-zinc-900">
        {/* soft background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-1/2 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl"
        />

        <header className="sticky top-[var(--header-h,0px)] z-10 border-b border-white/70 bg-white/60 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 pt-3">
            <div>
              <h1 className="font-serif text-2xl leading-tight text-rose-900">Talk it through</h1>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-violet-700">
                <LockIcon className="h-3 w-3" /> Private, anonymous, no judgment
              </p>
            </div>
            <button
              type="button"
              onClick={makeBrief}
              disabled={streaming || brief.loading}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-rose-700 shadow-sm ring-1 ring-rose-200 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <DocIcon className="h-4 w-4" /> Doctor brief
            </button>
          </div>
          <div className="mx-auto max-w-2xl px-4 pb-3 pt-2.5">
            <button
              type="button"
              role="switch"
              aria-checked={mode === 'after'}
              onClick={toggleMode}
              className="flex w-full items-center gap-3 rounded-2xl bg-white/70 px-3 py-2 text-left ring-1 ring-violet-100 transition hover:bg-white"
            >
              <span
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${mode === 'after' ? 'bg-violet-500' : 'bg-zinc-300'}`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${mode === 'after' ? 'translate-x-5' : ''}`}
                />
              </span>
              <span>
                <span className="block text-sm font-medium text-violet-900">I&apos;ve seen a doctor</span>
                <span className="block text-xs text-violet-800/70">
                  {mode === 'after'
                    ? "Companion mode: I'll help you understand your results and plan follow-ups."
                    : "Turn this on after a visit and I'll help you make sense of what you were told."}
                </span>
              </span>
            </button>
          </div>
        </header>

        <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-6" aria-live="polite">
          {hydrated && messages.length === 0 && (
            <div className="msg-in flex flex-col items-center px-2 pt-4 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-rose-300 to-violet-300 text-white shadow-lg shadow-rose-200">
                <SparkleIcon className="h-8 w-8" />
              </div>
              <h2 className="font-serif text-3xl text-rose-900">Hi, I&apos;m glad you&apos;re here.</h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-zinc-600">
                This is a private space, and nothing is too small or awkward to say. Tell me what&apos;s been going on
                in your own words. I&apos;ll ask one question at a time and tell you why I&apos;m asking.
              </p>
              <p className="mt-7 text-xs font-medium uppercase tracking-wider text-violet-700">
                Not sure where to start?
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {STARTERS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void send(prompt)}
                    className="rounded-full bg-white/80 px-4 py-2 text-sm text-rose-900 shadow-sm ring-1 ring-rose-100 transition hover:-translate-y-0.5 hover:bg-white hover:ring-rose-300"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <p className="mt-6 flex items-center gap-1.5 text-xs text-zinc-500">
                <ClipIcon className="h-3.5 w-3.5" /> You can also attach a lab report or ultrasound (PDF, JPG or PNG).
              </p>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`msg-in flex items-start gap-2.5 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'assistant' && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-rose-300 to-violet-300 text-white shadow-sm">
                  <SparkleIcon className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] px-4 py-3 text-base leading-relaxed ${
                  m.role === 'user'
                    ? 'rounded-3xl rounded-tr-md bg-linear-to-br from-violet-100 to-rose-100 text-violet-950 shadow-sm'
                    : m.error
                      ? 'rounded-3xl rounded-tl-md bg-rose-50 text-rose-900 ring-1 ring-rose-200'
                      : 'rounded-3xl rounded-tl-md bg-white/90 text-zinc-800 shadow-sm shadow-rose-100/60 ring-1 ring-rose-100'
                }`}
              >
                {m.attachments && m.attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {m.attachments.map((a, i) => (
                      <FileChip key={`${a.name}-${i}`} name={a.name} />
                    ))}
                  </div>
                )}
                {m.role === 'assistant' ? (
                  m.content ? (
                    <Markdown text={m.content} />
                  ) : (
                    <span className="inline-flex items-center gap-1.5 py-1.5" aria-label="Thinking">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-rose-300" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-fuchsia-300 [animation-delay:150ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-violet-300 [animation-delay:300ms]" />
                    </span>
                  )
                ) : (
                  m.content && <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </main>

        {/* Set --tabbar-h on a parent (e.g. the nav height) to lift the composer above a fixed tab bar. */}
        <div className="sticky bottom-[var(--tabbar-h,0px)] z-10 bg-linear-to-t from-violet-50 via-violet-50 to-violet-50/0 px-4 pb-4 pt-8">
          <div className="mx-auto max-w-2xl">
            {(pending.length > 0 || fileError) && (
              <div className="mb-2 space-y-1.5 px-1">
                {pending.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {pending.map((f, i) => (
                      <FileChip
                        key={`${f.name}-${i}`}
                        name={f.name}
                        onRemove={() => setPending((p) => p.filter((_, j) => j !== i))}
                      />
                    ))}
                  </div>
                )}
                {fileError && (
                  <p role="alert" className="text-xs text-rose-700">
                    {fileError}
                  </p>
                )}
              </div>
            )}
            <div className="flex items-end gap-1 rounded-3xl bg-white p-2 shadow-lg shadow-rose-200/40 ring-1 ring-rose-100 transition focus-within:ring-2 focus-within:ring-rose-300">
              <input ref={fileInputRef} type="file" accept={FILE_ACCEPT} multiple hidden onChange={addFiles} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach a PDF, JPG or PNG (up to 5 MB)"
                title="Attach a PDF, JPG or PNG (up to 5 MB)"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-violet-600 transition hover:bg-violet-50"
              >
                <ClipIcon className="h-5 w-5" />
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Say it in your own words…"
                aria-label="Message"
                className="max-h-36 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-base text-zinc-900 outline-none placeholder:text-zinc-400"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={!canSend}
                aria-label="Send"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-rose-400 to-fuchsia-500 text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <SendIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-zinc-500">
              <LockIcon className="h-3 w-3" /> Your messages, files and a short cycle summary are sent to the AI. Not a diagnosis. It can make mistakes.
            </p>
          </div>
        </div>
      </div>

      {brief.open && (
        <section
          aria-label="Doctor brief"
          className="print-panel fixed inset-0 z-50 overflow-y-auto bg-white bg-linear-to-b from-rose-50 to-white text-zinc-900"
        >
          <div className="mx-auto max-w-2xl px-5 py-6">
            <div className="no-print mb-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={closeBrief}
                className="rounded-full bg-white px-4 py-2 text-sm text-violet-800 shadow-sm ring-1 ring-violet-200 transition hover:bg-violet-50"
              >
                ← Back to chat
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                disabled={brief.loading || !brief.text}
                className="rounded-full bg-linear-to-br from-rose-400 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Print / Save as PDF
              </button>
            </div>

            <h1 className="font-serif text-3xl text-rose-900">Doctor brief</h1>
            <p className="mb-5 mt-1 border-b border-rose-200 pb-4 text-sm text-zinc-500">
              Prepared {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              {' · '}Based on my own notes and tracker. Not a diagnosis.
            </p>

            {brief.text && <Markdown text={brief.text} className="text-[15px] leading-relaxed" />}
            {brief.loading && (
              <p className="no-print mt-4 flex items-center gap-2 text-sm text-violet-700" role="status">
                <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" /> Putting your brief together…
              </p>
            )}
            {brief.error && (
              <p role="alert" className="mt-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-900 ring-1 ring-rose-200">
                {brief.error}
              </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}
