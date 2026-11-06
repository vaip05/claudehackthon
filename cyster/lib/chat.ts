// Types and constants shared by the Talk page (client) and /api/chat (server).

export type ChatMode = 'before' | 'after';

export const ALLOWED_MEDIA_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export type AttachmentMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

/** ~5 MB cap per file (before base64 encoding). */
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_MESSAGE = 3;

export type WireAttachment = {
  name: string;
  mediaType: AttachmentMediaType;
  /** base64, no data: prefix */
  data: string;
};

export type WireMessage = {
  role: 'user' | 'assistant';
  content: string;
  attachments?: WireAttachment[];
};

export type ChatRequestBody = {
  messages: WireMessage[];
  cycleSummary?: string;
  mode?: ChatMode;
};

export function isAllowedMediaType(value: unknown): value is AttachmentMediaType {
  return typeof value === 'string' && (ALLOWED_MEDIA_TYPES as readonly string[]).includes(value);
}

/** Fixed prompt for the "Make my doctor brief" button. */
export const DOCTOR_BRIEF_PROMPT = `Please write my doctor brief now, based on everything I've told you, the tracker context, and any reports I've uploaded.

Format it as markdown with exactly these five sections, in this order, each as a "## " heading:

## Symptom summary & timeline
## Flagged lab or imaging values
## Guideline criteria that appear relevant
## Tests to ask about
## Questions to ask the doctor

Rules:
- Start directly with the first heading. No title, intro, or closing chat.
- Keep the whole brief to about one page (roughly 350 words). Use short bullet points. Do not use tables.
- Use only what I've actually shared. If a section has nothing to report, write "- Nothing reported yet."
- In "Flagged lab or imaging values", list only the values that are high, low, or otherwise abnormal (value, units, reference range), then one final bullet naming the other tests that were within range.
- In "Guideline criteria that appear relevant", name the guideline (for example Rotterdam / 2023 International PCOS Guideline, or ESHRE 2022) and phrase each item as "matches patterns doctors look for in X — worth asking about". Do not diagnose.
- Do not ask me any questions in this reply.`;
