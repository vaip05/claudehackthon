import Anthropic from '@anthropic-ai/sdk';
import {
  MAX_ATTACHMENT_BYTES,
  isAllowedMediaType,
  type ChatMode,
  type ChatRequestBody,
  type WireMessage,
} from '@/lib/chat';
import { buildSystemPrompt } from '@/lib/systemPrompt';

const MODEL = 'claude-sonnet-5-5';
const MAX_TOKENS = 4096;

const MSG = {
  badRequest: "I couldn't read that message. Please try sending it again.",
  notConfigured:
    "The assistant isn't set up yet. Add a valid ANTHROPIC_API_KEY to .env.local and restart the dev server.",
  busy: "I'm getting a lot of requests right now. Give it a moment and try again.",
  tooBig: 'That file or conversation is too large for me to read. Try a smaller file or a fresh chat.',
  generic: "Sorry, I couldn't reach the assistant just now. Your message is saved, so please try again in a moment.",
  midStream: '\n\n_(Sorry, my reply got cut off. Please try again.)_',
  tooLong: '\n\n_(This reply was cut short because it got long. Ask me to continue and I will.)_',
} as const;

function json(error: string, status: number) {
  return Response.json({ error }, { status });
}

function apiKey(): string | null {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  return key && key !== '...' ? key : null;
}

/** Decoded size of a base64 string, without decoding it. */
function base64Bytes(data: string): number {
  const padding = data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0;
  return Math.floor((data.length * 3) / 4) - padding;
}

/**
 * Validates the body and maps it to Anthropic messages.
 * PDF -> document block, JPG/PNG -> image block (both base64). Returns null if the body is malformed.
 */
function toAnthropicMessages(raw: unknown): Anthropic.MessageParam[] | null {
  if (!Array.isArray(raw)) return null;

  const out: Anthropic.MessageParam[] = [];
  for (const m of raw as WireMessage[]) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') return null;
    const text = m.content.trim();

    if (m.role === 'assistant') {
      if (text) out.push({ role: 'assistant', content: text });
      continue;
    }

    const blocks: Anthropic.ContentBlockParam[] = [];
    for (const a of m.attachments ?? []) {
      if (!a || typeof a.data !== 'string' || !isAllowedMediaType(a.mediaType)) return null;
      if (base64Bytes(a.data) > MAX_ATTACHMENT_BYTES) return null;
      if (a.mediaType === 'application/pdf') {
        blocks.push({
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: a.data },
        });
      } else {
        blocks.push({
          type: 'image',
          source: { type: 'base64', media_type: a.mediaType, data: a.data },
        });
      }
    }
    if (text) blocks.push({ type: 'text', text });
    else if (blocks.length > 0) blocks.push({ type: 'text', text: "Here's a file I'd like help understanding." });
    if (blocks.length === 0) continue;

    out.push({ role: 'user', content: blocks });
  }

  // The API requires the conversation to start with a user turn.
  while (out.length > 0 && out[0].role !== 'user') out.shift();
  return out.length > 0 ? out : null;
}

function errorResponse(err: unknown): Response {
  const status = typeof err === 'object' && err && 'status' in err ? Number((err as { status: unknown }).status) : 0;
  console.error('[api/chat] Anthropic request failed', status || err);
  if (status === 401 || status === 403) return json(MSG.notConfigured, 500);
  if (status === 429 || status === 529) return json(MSG.busy, 503);
  if (status === 413) return json(MSG.tooBig, 413);
  return json(MSG.generic, 502);
}

export async function POST(request: Request) {
  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return json(MSG.badRequest, 400);
  }

  const messages = toAnthropicMessages(body?.messages);
  if (!messages) return json(MSG.badRequest, 400);

  const key = apiKey();
  if (!key) return json(MSG.notConfigured, 500);

  const mode: ChatMode = body.mode === 'after' ? 'after' : 'before';
  const cycleSummary = typeof body.cycleSummary === 'string' ? body.cycleSummary : '';

  const client = new Anthropic({ apiKey: key });
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: buildSystemPrompt(mode, cycleSummary),
    messages,
  });

  const events = stream[Symbol.asyncIterator]();
  let hitTokenLimit = false;
  let notedTokenLimit = false;
  const nextText = async (): Promise<string | null> => {
    for (;;) {
      const { value, done } = await events.next();
      if (done) {
        // Never end mid-sentence silently: tell the reader when the model ran out of room.
        if (hitTokenLimit && !notedTokenLimit) {
          notedTokenLimit = true;
          return MSG.tooLong;
        }
        return null;
      }
      if (value.type === 'message_delta' && value.delta.stop_reason === 'max_tokens') hitTokenLimit = true;
      if (value.type === 'content_block_delta' && value.delta.type === 'text_delta') return value.delta.text;
    }
  };

  // Wait for the first token so request-level failures (bad key, rate limit, ...)
  // come back as a proper error response instead of a half-empty stream.
  let first: string | null;
  try {
    first = await nextText();
  } catch (err) {
    return errorResponse(err);
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    start(controller) {
      if (first !== null) controller.enqueue(encoder.encode(first));
      else controller.close();
    },
    async pull(controller) {
      try {
        const text = await nextText();
        if (text === null) controller.close();
        else controller.enqueue(encoder.encode(text));
      } catch (err) {
        console.error('[api/chat] stream interrupted', err);
        controller.enqueue(encoder.encode(MSG.midStream));
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  });
}
