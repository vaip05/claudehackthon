'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WIPE_EVENT, getFocus, getLogs, setFocus as saveFocus } from '@/lib/storage';
import { currentPhase, todayISO } from '@/lib/cycle';
import {
  CATEGORIES,
  FOCUSES,
  FOCUS_LABELS,
  PHASES,
  PHASE_BLURBS,
  SOURCE_URLS,
  askLink,
  getTips,
  type Tip,
} from '@/lib/tips';
import type { Focus, Phase } from '@/lib/types';

const PHASE_LABEL: Record<Phase, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulatory: 'Ovulatory',
  luteal: 'Luteal',
};

const CATEGORY_STYLE: Record<Tip['category'], { heading: string; chip: string; icon: React.ReactNode }> = {
  Eat: {
    heading: 'What to eat',
    chip: 'bg-rose-soft text-rose-deep',
    icon: (
      <>
        <path d="M3 12h18a9 9 0 0 1-18 0z" />
        <path d="M8 8c0-1.5 1.5-1.5 1.5-3M13 8c0-1.5 1.5-1.5 1.5-3" />
      </>
    ),
  },
  Move: {
    heading: 'How to move',
    chip: 'bg-lavender-soft text-lavender-deep',
    icon: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  },
  Feel: {
    heading: 'How to feel your best',
    chip: 'bg-rose-soft/60 text-lavender-deep',
    icon: (
      <path d="M12 20s-7.5-4.6-8.7-9.4C2.5 7.6 4.3 5.5 6.7 5.5c2 0 3.5 1.3 5.3 3.3 1.8-2 3.3-3.3 5.3-3.3 2.4 0 4.2 2.1 3.4 5.1C19.5 15.4 12 20 12 20z" />
    ),
  },
};

function CategoryIcon({ category }: { category: Tip['category'] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {CATEGORY_STYLE[category].icon}
    </svg>
  );
}

function isFocus(v: unknown): v is Focus {
  return v === 'general' || v === 'pmos' || v === 'endo';
}

export default function Tips() {
  const [ready, setReady] = useState(false);
  const [focus, setFocusState] = useState<Focus>('general');
  const [detected, setDetected] = useState<Phase | null>(null);
  const [picked, setPicked] = useState<Phase | null>(null);

  useEffect(() => {
    // localStorage is only available in the browser, so read it after mount.
    const load = () => {
      const stored = getFocus();
      setFocusState(isFocus(stored) ? stored : 'general');
      setDetected(currentPhase(getLogs(), todayISO())?.phase ?? null);
      setPicked(null);
    };
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage is read after mount to avoid a hydration mismatch */
    load();
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    window.addEventListener(WIPE_EVENT, load);
    return () => window.removeEventListener(WIPE_EVENT, load);
  }, []);

  if (!ready) return <div className="flex-1" />;

  const phase = picked ?? detected;
  const tips = phase ? getTips(focus, phase) : [];

  const chooseFocus = (f: Focus) => {
    saveFocus(f);
    setFocusState(f);
  };

  return (
    <div className="space-y-5 md:space-y-8">
      {/* Desktop: the phase summary on the left, the phase and focus pickers on the right. */}
      <div className="space-y-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 lg:space-y-0">
      <section className="rounded-3xl bg-lavender-soft/60 p-5 md:p-8">
        {phase ? (
          <>
            <h1 className="text-xl font-semibold text-ink md:text-3xl">You&apos;re in your {phase} phase</h1>
            <p className="mt-1 text-sm text-ink/70">{PHASE_BLURBS[phase]}</p>
            <p className="mt-2 text-xs text-ink/60">
              {picked
                ? 'You picked this phase.'
                : 'Estimated from your tracker.'}{' '}
              {picked && detected && (
                <button onClick={() => setPicked(null)} className="text-lavender-deep underline">
                  Use my tracker&apos;s estimate ({detected})
                </button>
              )}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-ink md:text-3xl">Where are you in your cycle?</h1>
            <p className="mt-1 text-sm text-ink/70">
              Pick a phase below to see tips. Or log the first day of your period in{' '}
              <Link href="/track" className="text-lavender-deep underline">
                Track
              </Link>{' '}
              and we&apos;ll work it out for you.
            </p>
          </>
        )}
      </section>

      <div className="space-y-5">
      <section aria-label="Cycle phase" className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-ink/60">Phase</p>
        <div role="radiogroup" aria-label="Cycle phase" className="flex flex-wrap gap-2">
          {PHASES.map((p) => {
            const active = phase === p;
            return (
              <button
                key={p}
                role="radio"
                aria-checked={active}
                onClick={() => setPicked(p === detected ? null : p)}
                className={`rounded-full px-4 py-1.5 text-sm transition ${
                  active
                    ? 'bg-lavender-deep text-white shadow-sm'
                    : 'bg-white text-ink/70 ring-1 ring-lavender-soft hover:bg-lavender-soft/50'
                }`}
              >
                {PHASE_LABEL[p]}
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label="Focus" className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-ink/60">Focus</p>
        <div
          role="radiogroup"
          aria-label="Focus"
          className="grid grid-cols-3 gap-1 rounded-full bg-lavender-soft/60 p-1"
        >
          {FOCUSES.map((f) => {
            const active = focus === f;
            return (
              <button
                key={f}
                role="radio"
                aria-checked={active}
                onClick={() => chooseFocus(f)}
                className={`rounded-full px-2 py-2 text-sm transition ${
                  active ? 'bg-white font-semibold text-rose-deep shadow-sm' : 'text-ink/70'
                }`}
              >
                {FOCUS_LABELS[f]}
              </button>
            );
          })}
        </div>
        {focus === 'pmos' && (
          <p className="text-xs text-ink/60">
            With PMOS, cycles are often irregular, so treat the phase as a rough guide.
          </p>
        )}
        {focus === 'endo' && (
          <p className="text-xs text-ink/60">
            For endometriosis, research on food and exercise for pain is limited, so these are ideas
            to try, not treatments.
          </p>
        )}
      </section>
      </div>
      </div>

      {/* Desktop: Eat, Move and Feel sit side by side as three columns. */}
      <div className="space-y-5 lg:grid lg:grid-cols-3 lg:items-start lg:gap-8 lg:space-y-0">
      {phase &&
        CATEGORIES.map((category) => {
          const group = tips.filter((t) => t.category === category);
          if (group.length === 0) return null;
          return (
            <section key={category} aria-label={category} className="space-y-3">
              <h2
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold md:text-sm ${CATEGORY_STYLE[category].chip}`}
              >
                <CategoryIcon category={category} />
                {CATEGORY_STYLE[category].heading}
              </h2>
              <ul className="space-y-3">
                {group.map((tip) => (
                  <li key={tip.title} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-lavender-soft md:p-5">
                    <h3 className="text-base font-semibold text-ink">{tip.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink/75">{tip.why}</p>
                    {tip.source && (
                      <p className="mt-2 text-xs text-ink/60">
                        Source:{' '}
                        {SOURCE_URLS[tip.source] ? (
                          <a
                            href={SOURCE_URLS[tip.source]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {tip.source}
                          </a>
                        ) : (
                          tip.source
                        )}
                      </p>
                    )}
                    <Link
                      href={askLink(tip, focus, phase)}
                      className="mt-3 inline-block rounded-full bg-rose-soft px-3.5 py-1.5 text-xs font-medium text-rose-deep transition hover:bg-rose-soft/70"
                    >
                      Ask Cyster about this
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
