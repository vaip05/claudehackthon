# Hush: Product & Build Spec (MVP)

> A private cycle tracker, lifestyle guide, and AI companion for PMOS & endometriosis.
> **Build target:** working MVP in 90 minutes with 3 people.

---

## 1. Problem
- Endometriosis takes **7–10 years** to diagnose on average.
- Up to **~70% of PMOS** cases (polyendocrine metabolic ovarian syndrome, formerly PCOS) are thought to be undiagnosed.
- Stigma is a major reason. People treat pain and irregular cycles as normal, don't have words for their symptoms, or feel too embarrassed to bring them up with a doctor.

## 2. Solution
**Hush** is a private web app that people *want* to open every day. That daily habit makes it the natural, low-pressure place to raise a concern.

| Feature | What it does |
|---|---|
| **Track** | Log period days and symptoms; see your current cycle phase and next predicted period |
| **Tips** | Diet, movement, and wellbeing tips for your current phase, with PMOS and endometriosis tracks |
| **Talk** | An anonymous AI agent. You describe symptoms in your own words and can upload reports (sonograms, hormone panels). It screens against clinical guideline criteria, writes a doctor-ready brief, and after a provider visit explains results and next steps |

**Tracker → Agent loop:** patterns in your logs (irregular cycles, recurring severe pain) are passed to the agent as context, so it can bring them up gently.

## 3. Principles
1. **Never diagnose.** Screen, explain, advocate, and send people to clinicians. Use "matches patterns doctors look for in X", never "you have X".
2. **Safety first.** Every chat turn checks for red flags before anything else.
3. **Private by default.** No accounts and no database. All data stays in `localStorage`; only chat messages go to the AI.
4. **Shame-free language.** Accept euphemisms and slang, and treat the topic as normal.
5. **Cite sources.** Screening criteria and tips name the guideline they come from.

## 4. Out of scope (MVP)
Accounts, database, multi-step agent tool loops, unit tests, multilingual polish, native mobile app.

---

## 5. Tech stack
- **Next.js (App Router) + TypeScript + Tailwind**
  `npx create-next-app@latest hush --ts --tailwind --app`
- **Claude API** via `@anthropic-ai/sdk`, model `claude-sonnet-5-5`. Send PDFs and images directly as document/image content blocks (no OCR needed).
- **Env:** `.env.local` → `ANTHROPIC_API_KEY` (never commit it)
- **Deploy:** Vercel (optional)

## 6. Shared contract (build first, minutes 0–10)

### `lib/types.ts`
```ts
export type Flow = 'none' | 'light' | 'medium' | 'heavy';
export type Symptom =
  | 'cramps' | 'acne' | 'bloating' | 'fatigue' | 'pain_sex'
  | 'pain_bowel' | 'mood' | 'headache' | 'hair_growth';

export type DayLog = {
  date: string;          // YYYY-MM-DD
  flow?: Flow;
  pain?: 0 | 1 | 2 | 3;
  symptoms?: Symptom[];
};

export type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';
export type Focus = 'general' | 'pmos' | 'endo';
```

### `lib/storage.ts`
| Function | Purpose |
|---|---|
| `getLogs(): DayLog[]` | Read all logs |
| `saveLog(log: DayLog)` | Upsert a log by date |
| `getFocus(): Focus` / `setFocus(f)` | Tips track |
| `wipeAll()` | Clear every `hush.*` key |

`localStorage` keys: `hush.logs`, `hush.focus`, `hush.chat`

### Layout
- Bottom tab bar: **Track** (`/`) | **Tips** (`/tips`) | **Talk** (`/talk`)
- Header: app name + **"Delete everything"** button (calls `wipeAll()`)
- Soft, calm palette (e.g., rose/lavender on off-white)

---

## 7. Feature specs

### 7.1 Track (Person B)
**Files:** `app/page.tsx`, `lib/cycle.ts`, `components/Calendar.tsx`, `components/LogSheet.tsx`

**UI**
- Month calendar grid; days with flow are tinted, days with pain get a dot.
- Tapping a day opens a log sheet: flow selector, pain 0–3, symptom chips.
- Status card: *"Day 12 · Follicular phase · Next period ~Nov 20"*.
- Insight card (shown when flags exist): *"Your cycles have been irregular lately. Want to talk it through?"* → links to `/talk`.
- **"Load demo data"** button: seeds 4 months of irregular cycles (~38–45 days) with cramps and acne.

**`lib/cycle.ts`**
| Function | Logic |
|---|---|
| `cycleStarts(logs)` | First flow day after ≥ 3 days with no flow |
| `avgCycleLength(logs)` | Mean gap between starts (default 28) |
| `currentPhase(logs, today)` | Days 1–5 = menstrual; ovulation ≈ cycle length − 14; ovulation ±1 day = ovulatory; before that = follicular; after = luteal |
| `predictNextPeriod(logs)` | Last start + avg length |
| `insights(logs)` | Returns flags (below) |
| `cycleSummary(logs)` | Short plain-text summary passed to the agent |

**Insight flags**
| Flag | Rule | Signal |
|---|---|---|
| `irregular` | Any cycle > 35 or < 21 days, or a > 7-day spread between cycles | PMOS |
| `painful_periods` | Pain ≥ 2 on most period days | Endometriosis |
| `deep_pain` | `pain_sex` or `pain_bowel` logged | Endometriosis |
| `androgen` | `acne` or `hair_growth` logged repeatedly | PMOS |

### 7.2 Tips (Person C)
**Files:** `app/tips/page.tsx`, `lib/tips.ts`

**Data shape**
```ts
type Tip = { category: 'Eat' | 'Move' | 'Feel'; title: string; why: string; source?: string };
type TipsMap = Record<Focus, Record<Phase, Tip[]>>;  // 3–4 tips per cell
```

**Content guidance**
- **General:** menstrual → iron-rich foods, gentle yoga, rest; follicular → harder workouts; ovulatory → high-energy activity, social plans; luteal → magnesium (dark chocolate, seeds), complex carbs for cravings, more sleep.
- **PMOS:** low-GI carbs, protein with every meal, strength training, consistent sleep, stress management, spearmint tea (for androgen symptoms). Source: *Intl PCOS Guideline 2023*.
- **Endometriosis:** anti-inflammatory foods (omega-3, leafy greens), less red meat and alcohol, heat therapy, pelvic stretches, pacing on flare days. Source: *ESHRE 2022*.

**UI**
- Header: *"You're in your luteal phase"* (from `currentPhase()`).
- Focus selector: General / PMOS / Endometriosis (persists via `setFocus`).
- Tip cards grouped by Eat / Move / Feel.
- **"Ask Hush about this"** button → `/talk?q=<prefilled question>`.

**Also owned by C:** first-visit privacy banner (*"Your tracking data never leaves your device. Only your chat with the AI is sent, and nothing is stored."*), the "Not a diagnosis" disclaimer, and the pitch and demo script.

### 7.3 Talk: AI agent (Person A)
**Files:** `app/talk/page.tsx`, `app/api/chat/route.ts`, `lib/systemPrompt.ts`

**API: `POST /api/chat`**
- Body: `{ messages, cycleSummary, mode: 'before' | 'after' }`
- Builds the system prompt from `mode` + `cycleSummary`, calls Claude, and streams the text back.
- Attachments: PDF → `document` content block; JPG/PNG → `image` content block.

**System prompt requirements**
1. **Persona:** warm and shame-free; matches the user's vocabulary; accepts euphemisms; asks one question at a time and explains *why* it's asking.
2. **Red flags first.** If the user mentions any of the following, lead with urgent-care advice:
   - soaking a pad or tampon every hour, fainting or dizziness, fever with pelvic pain, sudden severe pain, possible pregnancy with pain or bleeding.
3. **Screening criteria**
   - **PMOS (Rotterdam / 2023 Intl Guideline):** 2 of 3: irregular or absent ovulation; hyperandrogenism (acne, hair growth, high testosterone); polycystic ovaries on ultrasound or high AMH. Note that thyroid and prolactin causes should be ruled out.
   - **Endometriosis (ESHRE 2022):** painful periods, pain during sex, pain with bowel movements or urination, chronic pelvic pain, infertility, endometrioma on imaging.
4. **Never diagnose.** Use "matches patterns doctors look for in X — worth asking about."
5. **Reports:** extract and explain LH, FSH, LH:FSH ratio, testosterone, SHBG, AMH, DHEA-S, TSH, prolactin, fasting insulin and glucose; ultrasound follicle count, ovarian volume, endometrioma.
6. **`mode: 'after'`** (companion): explain the diagnosis in plain language and evidence-based management (lifestyle, tracking, treatment options a doctor may discuss); help prepare questions for follow-up; defer on medication decisions.

**UI**
- Chat thread with streaming responses; file attach button.
- Pre-fills its input from `?q=` when opened from Tips or an insight card.
- Toggle: **"I've seen a doctor"** → `mode: 'after'`.
- **"Make my doctor brief"** button → sends a fixed prompt asking for markdown with:
  - Symptom summary & timeline
  - Flagged lab or imaging values
  - Guideline criteria that appear relevant
  - Tests to ask about
  - Questions to ask the doctor
- The brief renders in a print-friendly panel with a **Print / Save as PDF** button (`window.print()`).

---

## 8. Team & timeline
| Minutes | Person A (Agent) | Person B (Tracker) | Person C (Tips/Pitch) |
|---|---|---|---|
| 0–10 | Scaffold repo, share it, add API key | `types.ts`, `storage.ts`, layout/nav | Draft tips content |
| 10–60 | Chat route, prompt, Talk UI, uploads, brief | Calendar, log sheet, `cycle.ts`, insights, demo seed | `tips.ts`, Tips page, banner, disclaimer |
| 60–75 | **Integrate together:** cycle summary → chat, `?q=` links, styling | | |
| 75–90 | **Demo run-through**, bug fixes, optional Vercel deploy | | Pitch script |

## 9. Acceptance criteria / demo script
1. `npm run dev` → **Load demo data** → Track shows the current phase, next-period prediction, and an **irregular-cycle insight** card.
2. **Tips** shows tips for the current phase; switching the focus to PMOS changes them.
3. Tap the insight → **Talk** opens; the agent already knows about the irregular cycles and asks about acne or hair growth.
4. Upload a sample hormone report (a fake PDF with high testosterone + AMH) → the agent explains each value and notes that PMOS criteria signals are present, **without diagnosing**.
5. **Make my doctor brief** → a printable brief with all five sections.
6. Send *"I'm soaking a pad every hour and feel dizzy"* → the response **leads with urgent-care advice**.
7. **Delete everything** → all `hush.*` data is cleared and the app resets.

## 10. Stretch goals (post-hackathon)
- Multilingual support + WhatsApp/SMS channel
- Structured tool use with deterministic scoring code
- Export the symptom log as a CSV/PDF attached to the doctor brief
- Clinician-reviewed tips content
- Encrypted optional cloud sync
