import type { DayLog } from './types';

// NOTE: Minimal version so the Talk page can pass tracker context to the agent.
// Person B owns this file and will extend it (currentPhase, predictNextPeriod, insights, ...).
// Keep the cycleSummary(logs): string signature.

const DAY_MS = 86_400_000;

function dayNumber(date: string): number {
  return Math.round(Date.parse(`${date}T00:00:00Z`) / DAY_MS);
}

function hasFlow(log: DayLog): boolean {
  return !!log.flow && log.flow !== 'none';
}

/** First flow day after at least 3 days with no flow. Returns YYYY-MM-DD strings, oldest first. */
export function cycleStarts(logs: DayLog[]): string[] {
  const flowDays = logs
    .filter(hasFlow)
    .map((l) => l.date)
    .sort();
  const starts: string[] = [];
  let prev: string | null = null;
  for (const date of flowDays) {
    if (prev === null || dayNumber(date) - dayNumber(prev) - 1 >= 3) starts.push(date);
    prev = date;
  }
  return starts;
}

function cycleLengths(starts: string[]): number[] {
  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i++) lengths.push(dayNumber(starts[i]) - dayNumber(starts[i - 1]));
  return lengths;
}

/** Mean gap between cycle starts (default 28). */
export function avgCycleLength(logs: DayLog[]): number {
  const lengths = cycleLengths(cycleStarts(logs));
  if (lengths.length === 0) return 28;
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

const SYMPTOM_LABELS: Record<string, string> = {
  cramps: 'cramps',
  acne: 'acne',
  bloating: 'bloating',
  fatigue: 'fatigue',
  pain_sex: 'pain during sex',
  pain_bowel: 'pain with bowel movements',
  mood: 'mood changes',
  headache: 'headache',
  hair_growth: 'excess hair growth',
};

/** Short plain-text summary of the tracker data, passed to the agent as context. Empty string if no data. */
export function cycleSummary(logs: DayLog[]): string {
  if (logs.length === 0) return '';

  const lines: string[] = [];
  const starts = cycleStarts(logs);
  const lengths = cycleLengths(starts);

  lines.push(`${logs.length} days logged.`);

  if (starts.length === 0) {
    lines.push('No period days logged yet.');
  } else {
    lines.push(`Period starts logged: ${starts.join(', ')}.`);
    if (lengths.length > 0) {
      const min = Math.min(...lengths);
      const max = Math.max(...lengths);
      lines.push(`Cycle lengths (days): ${lengths.join(', ')}. Average ${avgCycleLength(logs)}, range ${min}-${max}.`);
    } else {
      lines.push('Only one cycle start logged, so cycle length is unknown.');
    }
  }

  const periodDays = logs.filter(hasFlow);
  if (periodDays.length > 0) {
    const painful = periodDays.filter((l) => (l.pain ?? 0) >= 2).length;
    lines.push(`Pain of 2 or more (on a 0-3 scale) on ${painful} of ${periodDays.length} period days.`);
  }

  const counts = new Map<string, number>();
  for (const log of logs) for (const s of log.symptoms ?? []) counts.set(s, (counts.get(s) ?? 0) + 1);
  if (counts.size > 0) {
    const parts = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([s, n]) => `${SYMPTOM_LABELS[s] ?? s} (${n} days)`);
    lines.push(`Symptoms logged: ${parts.join(', ')}.`);
  }

  return lines.join('\n');
}
