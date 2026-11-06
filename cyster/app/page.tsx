'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Calendar from '@/components/Calendar';
import LogSheet from '@/components/LogSheet';
import { getLogs, saveLog, setLogs } from '@/lib/storage';
import {
  avgPeriodLength,
  currentPhase,
  dateRange,
  cycleSummary,
  formatShort,
  insights,
  todayISO,
  upcomingPeriods,
} from '@/lib/cycle';
import { buildDemoLogs } from '@/lib/demo';
import type { DayLog, InsightFlag, Phase } from '@/lib/types';

const PHASE_LABEL: Record<Phase, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulatory: 'Ovulatory',
  luteal: 'Luteal',
};

const FLAG_TEXT: Record<InsightFlag, string> = {
  irregular: 'your cycle length has varied quite a bit',
  painful_periods: 'your periods have often been painful',
  deep_pain: 'you logged pain during sex or bowel movements',
  androgen: 'you have logged acne or hair growth several times',
};

export default function TrackPage() {
  const [ready, setReady] = useState(false);
  const [logs, setLogsState] = useState<DayLog[]>([]);
  const [view, setView] = useState<{ y: number; m: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const refresh = () => setLogsState(getLogs());

  // localStorage is only available in the browser, so read it after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is read after mount to avoid hydration mismatch
    refresh();
    const now = new Date();
    setView({ y: now.getFullYear(), m: now.getMonth() });
    setReady(true);
  }, []);

  if (!ready || !view) return null;

  const today = todayISO();
  const cycle = currentPhase(logs, today);
  const upcoming = upcomingPeriods(logs, today, 3);
  const next = upcoming[0] ?? null;
  const flags = insights(logs);

  const shift = (delta: number) =>
    setView((v) => {
      if (!v) return v;
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const loadDemo = () => {
    if (logs.length > 0 && !window.confirm('Replace your current logs with demo data?')) return;
    setLogs(buildDemoLogs(today));
    refresh();
  };

  const markMissed = (date: string) => {
    saveLog({ date, missed: true });
    refresh();
  };

  const question = encodeURIComponent(
    `I've been tracking my cycle. ${cycleSummary(logs)} Can we talk about what this could mean?`,
  );

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-lavender-soft/60 p-5">
        {cycle ? (
          <>
            <p className="text-lg font-semibold">
              Day {cycle.day} · {PHASE_LABEL[cycle.phase]} phase
            </p>
            {next &&
              (next.overdue ? (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-ink/70">
                    Period expected {formatShort(next.date)} and hasn&apos;t started.
                  </p>
                  <button
                    onClick={() => markMissed(next.date)}
                    className="rounded-full bg-white px-3 py-1 text-xs text-rose-deep shadow-sm"
                  >
                    It didn&apos;t come
                  </button>
                </div>
              ) : (
                <div className="mt-1 text-sm text-ink/70">
                  <p>Next period ~{formatShort(next.date)}</p>
                  <p className="text-xs text-ink/60">
                    {next.earliest !== next.latest &&
                      `Likely ${formatShort(next.earliest)}–${formatShort(next.latest)} · `}
                    usually lasts about {avgPeriodLength(logs)} days
                  </p>
                </div>
              ))}
          </>
        ) : (
          <p className="text-sm text-ink/70">
            Log the first day of your period to see your phase and predictions.
          </p>
        )}
        <button onClick={loadDemo} className="mt-3 text-xs text-lavender-deep underline">
          Load demo data
        </button>
      </section>

      {flags.length > 0 && (
        <Link
          href={`/talk?q=${question}`}
          className="block rounded-3xl bg-rose-soft/70 p-5 transition hover:bg-rose-soft"
        >
          <p className="text-sm text-ink">
            Your log suggests {flags.map((f) => FLAG_TEXT[f]).join(', ')}. Want to talk it through?
          </p>
          <p className="mt-2 text-xs text-ink/60">Patterns to discuss with a clinician, not a diagnosis.</p>
        </Link>
      )}

      <Calendar
        year={view.y}
        month={view.m}
        logs={logs}
        predicted={upcoming.map((u) => u.date)}
        windowDays={upcoming
          .filter((u) => u.latest >= today)
          .flatMap((u) => dateRange(u.earliest, u.latest))}
        selected={selected}
        today={today}
        onPrev={() => shift(-1)}
        onNext={() => shift(1)}
        onSelect={setSelected}
      />
      <p className="text-center text-xs text-ink/60">
        Dashed = expected start · shaded = likely window · ✕ = missed
      </p>

      {selected && (
        <LogSheet
          key={selected}
          date={selected}
          existing={logs.find((l) => l.date === selected)}
          onClose={() => setSelected(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
