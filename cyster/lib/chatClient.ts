import type { ChatMode, WireMessage } from './chat';

/**
 * POSTs to /api/chat and calls onText with each streamed chunk.
 * Throws an Error whose message is safe to show to the user.
 */
export async function streamChat(opts: {
  messages: WireMessage[];
  mode: ChatMode;
  cycleSummary: string;
  signal?: AbortSignal;
  onText: (chunk: string) => void;
}): Promise<void> {
  const { messages, mode, cycleSummary, signal, onText } = opts;

  let res: Response;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, mode, cycleSummary }),
      signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new Error("I couldn't connect. Check your internet connection and try again.");
  }

  if (!res.ok || !res.body) {
    let message = 'Sorry, something went wrong. Please try again.';
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // keep the default message
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) onText(chunk);
  }
  const rest = decoder.decode();
  if (rest) onText(rest);
}
