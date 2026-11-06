import type { DayLog, InsightFlag, Phase, Symptom } from './types';

const DAY_MS = 86_400_000;
const DEFAULT_CYCLE_LENGTH = 28;

// ---------- date helpers (all dates are local YYYY-MM-DD strings) ----------

export function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function todayISO(): string {
  return toISO(new Date());
}

function dayNum(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function daysBetween(a: string, b: string): number {
  return dayNum(b) - dayNum(a);
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}

/** Every date from `from` to `to`, inclusive. */
export function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

export function formatShort(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---------- cycle logic ----------

const sortByDate = (logs: DayLog[]) => [...logs].sort((a, b) => a.date.localeCompare(b.date));

const flowLogs = (logs: DayLog[]) =>
  sortByDate(logs).filter((l) => l.flow && l.flow !== 'none');

/** Start of each period: a flow day after at least 3 flow-free days. */
export function cycleStarts(logs: DayLog[]): string[] {
  const starts: string[] = [];
  let prev: number | null = null;
  for (const l of flowLogs(logs)) {
    const n = dayNum(l.date);
    // 3 flow-free days between means a gap of at least 4 days between flow days
    if (prev === null || n - prev >= 4) starts.push(l.date);
    prev = n;
  }
  return starts;
}

/** Days between consecutive period starts (completed cycles). */
function cycleGaps(logs: DayLog[]): number[] {
  const s = cycleStarts(logs);
  return s.slice(1).map((d, i) => daysBetween(s[i], d));
}

/** Gaps between starts that don't span a missed period (those aren't real cycles). */
function cleanGaps(logs: DayLog[]): number[] {
  const s = cycleStarts(logs);
  const missed = logs.filter((l) => l.missed).map((l) => l.date);
  const out: number[] = [];
  for (let i = 0; i < s.length - 1; i++) {
    const spansMissed = missed.some((m) => m > s[i] && m < s[i + 1]);
    if (!spansMissed) out.push(daysBetween(s[i], s[i + 1]));
  }
  return out;
}

export function avgCycleLength(logs: DayLog[]): number {
  const gaps = cleanGaps(logs);
  if (gaps.length === 0) return DEFAULT_CYCLE_LENGTH;
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

export function currentPhase(
  logs: DayLog[],
  today: string,
): { phase: Phase; day: number } | null {
  const starts = cycleStarts(logs);
  if (starts.length === 0) return null;

  const day = daysBetween(starts[starts.length - 1], today) + 1;
  if (day < 1) return null;

  const ovDay = avgCycleLength(logs) - 14;
  let phase: Phase;
  if (day <= 5) phase = 'menstrual';
  else if (day >= ovDay - 1 && day <= ovDay + 1) phase = 'ovulatory';
  else if (day < ovDay - 1) phase = 'follicular';
  else phase = 'luteal';

  return { phase, day };
}

/** Average number of consecutive flow days per period. */
export function avgPeriodLength(logs: DayLog[]): number {
  const starts = cycleStarts(logs);
  const flowNums = flowLogs(logs).map((l) => dayNum(l.date));
  const lengths: number[] = [];

  for (const s of starts) {
    const startNum = dayNum(s);
    let len = 0;
    let prev = startNum - 1;
    for (const n of flowNums) {
      if (n < startNum) continue;
      if (n - prev !== 1) break; // bleeding stopped
      len++;
      prev = n;
    }
    lengths.push(len);
  }

  if (lengths.length === 0) return 5;
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

export type Prediction = {
  date: string; // expected start
  earliest: string; // start of likely window (from shortest logged cycle)
  latest: string; // end of likely window (from longest logged cycle)
  end: string; // expected last day of bleeding (from average period length)
  overdue: boolean;
};

/**
 * Upcoming expected period starts. A predicted date marked missed is skipped
 * forward by one cycle. `overdue` means the date has passed with no period logged.
 */
export function upcomingPeriods(logs: DayLog[], today: string, count = 3): Prediction[] {
  const starts = cycleStarts(logs);
  if (starts.length === 0) return [];
  const len = avgCycleLength(logs);
  const gaps = cleanGaps(logs);
  const minGap = gaps.length ? Math.min(...gaps) : len;
  const maxGap = gaps.length ? Math.max(...gaps) : len;
  const periodDays = avgPeriodLength(logs);
  const missed = new Set(logs.filter((l) => l.missed).map((l) => l.date));

  const out: Prediction[] = [];
  let p = addDays(starts[starts.length - 1], len);
  while (out.length < count) {
    if (missed.has(p)) {
      p = addDays(p, len);
      continue;
    }
    out.push({
      date: p,
      earliest: addDays(p, minGap - len),
      latest: addDays(p, maxGap - len),
      end: addDays(p, periodDays - 1),
      overdue: p < today,
    });
    p = addDays(p, len);
  }
  return out;
}

export function predictNextPeriod(logs: DayLog[], today: string): Prediction | null {
  return upcomingPeriods(logs, today, 1)[0] ?? null;
}

export function insights(logs: DayLog[]): InsightFlag[] {
  const flags: InsightFlag[] = [];

  // irregular: needs at least 2 completed cycles
  const gaps = cycleGaps(logs);
  if (gaps.length >= 2) {
    const outOfRange = gaps.some((g) => g > 35 || g < 21);
    const spread = Math.max(...gaps) - Math.min(...gaps) > 7;
    if (outOfRange || spread) flags.push('irregular');
  }

  // a logged missed period is itself a sign of irregularity
  if (logs.some((l) => l.missed) && !flags.includes('irregular')) flags.push('irregular');

  // painful_periods: pain >= 2 on more than 50% of flow days
  const flow = flowLogs(logs);
  if (flow.length > 0) {
    const painful = flow.filter((l) => (l.pain ?? 0) >= 2).length;
    if (painful / flow.length > 0.5) flags.push('painful_periods');
  }

  // deep_pain: any single log
  const hasDeepPain = logs.some(
    (l) => l.symptoms?.includes('pain_sex') || l.symptoms?.includes('pain_bowel'),
  );
  if (hasDeepPain) flags.push('deep_pain');

  // androgen: acne or hair growth on at least 3 days
  const androgenDays = logs.filter((l) =>
    l.symptoms?.some((s) => s === 'acne' || s === 'hair_growth'),
  ).length;
  if (androgenDays >= 3) flags.push('androgen');

  return flags;
}

export function cycleSummary(logs: DayLog[]): string {
  const parts: string[] = [];
  const starts = cycleStarts(logs);
  const gaps = cycleGaps(logs);

  if (gaps.length > 0) {
    parts.push(
      `Avg cycle ${avgCycleLength(logs)} days (range ${Math.min(...gaps)}-${Math.max(...gaps)}).`,
    );
  } else {
    parts.push('Not enough cycles logged yet to estimate cycle length.');
  }

  if (starts.length > 0) {
    parts.push(`Last period started ${formatShort(starts[starts.length - 1])}.`);
  }
  if (starts.length > 0) {
    parts.push(`Usual period length ${avgPeriodLength(logs)} days.`);
  }

  const flow = flowLogs(logs);
  if (flow.length > 0) {
    const painful = flow.filter((l) => (l.pain ?? 0) >= 2).length;
    parts.push(`Pain ≥2 on ${Math.round((painful / flow.length) * 100)}% of period days.`);
  }

  const count = (sym: Symptom) => logs.filter((l) => l.symptoms?.includes(sym)).length;

  const acne = count('acne');
  if (acne) parts.push(`Acne logged ${acne} times.`);

  const hair = count('hair_growth');
  if (hair) parts.push(`Hair growth logged ${hair} times.`);

  const sex = count('pain_sex');
  parts.push(sex ? `Pain during sex logged ${sex} times.` : 'No pain during sex logged.');

  const bowel = count('pain_bowel');
  if (bowel) parts.push(`Pain with bowel movements logged ${bowel} times.`);

  const missedCount = logs.filter((l) => l.missed).length;
  if (missedCount) parts.push(`Missed periods logged: ${missedCount}.`);

  return parts.join(' ');
}
