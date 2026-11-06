'use client';

import type { DayLog } from '@/lib/types';

type Props = {
  year: number;
  month: number; // 0-11
  logs: DayLog[];
  predicted: string[]; // upcoming expected period starts
  windowDays: string[]; // likely window around each predicted start
  selected: string | null;
  today: string;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (iso: string) => void;
};

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Calendar({
  year,
  month,
  logs,
  predicted,
  windowDays,
  selected,
  today,
  onPrev,
  onNext,
  onSelect,
}: Props) {
  const byDate = new Map(logs.map((l) => [l.date, l]));
  const windowSet = new Set(windowDays);
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mm = String(month + 1).padStart(2, '0');

  const cells: (string | null)[] = Array(first.getDay()).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${mm}-${String(d).padStart(2, '0')}`);
  }

  const title = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={onPrev} aria-label="Previous month" className="px-3 py-1 text-xl text-ink/70">
          ‹
        </button>
        <h2 className="font-semibold">{title}</h2>
        <button onClick={onNext} aria-label="Next month" className="px-3 py-1 text-xl text-ink/70">
          ›
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-xs text-ink/70">
        {WEEKDAYS.map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((iso, i) => {
          if (!iso) return <div key={`empty-${i}`} />;

          const log = byDate.get(iso);
          const hasFlow = !!log?.flow && log.flow !== 'none';
          const hasPain = (log?.pain ?? 0) >= 1;
          const isToday = iso === today;
          const isSelected = iso === selected;
          const isPredicted = predicted.includes(iso);
          const isWindow = windowSet.has(iso);
          const isMissed = !!log?.missed;

          const classes = [
            'relative aspect-square rounded-xl text-sm',
            hasFlow ? 'bg-rose-soft font-semibold text-rose-deep' : 'hover:bg-lavender-soft/60',
            isWindow && !hasFlow ? 'bg-lavender-soft/50' : '',
            isToday ? 'ring-2 ring-lavender-deep' : '',
            isSelected ? 'ring-2 ring-rose-deep' : '',
            isPredicted ? 'border border-dashed border-rose-deep/70' : '',
          ].join(' ');

          return (
            <button key={iso} onClick={() => onSelect(iso)} aria-label={iso} className={classes}>
              {Number(iso.slice(-2))}
              {isMissed && (
                <span className="absolute right-1 top-0.5 text-[10px] text-rose-deep">✕</span>
              )}
              {hasPain && (
                <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-lavender-deep" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
