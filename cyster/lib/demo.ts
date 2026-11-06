import { addDays, todayISO } from './cycle';
import type { DayLog, Flow } from './types';

/**
 * Four completed cycles (38, 42, 45, 39 days), with today on day 12 of the
 * current cycle. Period = 5 flow days with mostly 2-3 pain, cramps on period
 * days, and acne scattered through each cycle.
 */
export function buildDemoLogs(today: string = todayISO()): DayLog[] {
  const lengths = [38, 42, 45, 39];
  const CURRENT_DAY = 12;

  // starts[i] -> starts[i + 1] is lengths[i]; the last start is the current cycle
  const starts = [addDays(today, -(CURRENT_DAY - 1))];
  for (let i = lengths.length - 1; i >= 0; i--) {
    starts.unshift(addDays(starts[0], -lengths[i]));
  }

  const FLOWS: Flow[] = ['heavy', 'medium', 'light', 'medium', 'light'];
  const PAINS = [3, 3, 2, 2, 1] as const;
  const logs: DayLog[] = [];

  starts.forEach((start, i) => {
    const length = i < lengths.length ? lengths[i] : null; // current cycle is unfinished

    for (let d = 0; d < 5; d++) {
      const date = addDays(start, d);
      if (date > today) break;
      logs.push({ date, flow: FLOWS[d], pain: PAINS[d], symptoms: ['cramps'] });
    }

    for (const offset of [8, 15, 22, 29]) {
      if (length !== null && offset >= length) continue;
      const date = addDays(start, offset);
      if (date > today) continue;
      logs.push({ date, symptoms: ['acne'] });
    }
  });

  return logs.sort((a, b) => a.date.localeCompare(b.date));
}
