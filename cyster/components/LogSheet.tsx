'use client';

import { useState } from 'react';
import { saveLog } from '@/lib/storage';
import { formatShort } from '@/lib/cycle';
import type { DayLog, Flow, Symptom } from '@/lib/types';

const FLOW_OPTIONS: { value: Flow; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
];

const PAIN_OPTIONS: { value: 0 | 1 | 2 | 3; label: string }[] = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Mild' },
  { value: 2, label: 'Moderate' },
  { value: 3, label: 'Severe' },
];

const SYMPTOM_OPTIONS: { value: Symptom; label: string }[] = [
  { value: 'cramps', label: 'Cramps' },
  { value: 'acne', label: 'Acne' },
  { value: 'bloating', label: 'Bloating' },
  { value: 'fatigue', label: 'Fatigue' },
  { value: 'pain_sex', label: 'Pain during sex' },
  { value: 'pain_bowel', label: 'Pain with bowel movements' },
  { value: 'mood', label: 'Mood' },
  { value: 'headache', label: 'Headache' },
  { value: 'hair_growth', label: 'Hair growth' },
];

type Props = {
  date: string;
  existing?: DayLog;
  onClose: () => void;
  onSaved: () => void;
};

// Parent should pass key={date} so state resets when a different day is opened.
export default function LogSheet({ date, existing, onClose, onSaved }: Props) {
  const [flow, setFlow] = useState<Flow | undefined>(existing?.flow);
  const [pain, setPain] = useState<0 | 1 | 2 | 3 | undefined>(existing?.pain);
  const [symptoms, setSymptoms] = useState<Symptom[]>(existing?.symptoms ?? []);
  const [missed, setMissed] = useState<boolean>(!!existing?.missed);

  const toggleSymptom = (s: Symptom) =>
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const save = () => {
    // a missed day holds no flow or symptoms; it just marks the expected period as missed
    saveLog(missed ? { date, missed: true } : { date, flow, pain, symptoms });
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-20 flex items-end bg-ink/30" onClick={onClose}>
      <div
        role="dialog"
        aria-label={`Log for ${date}`}
        onClick={(e) => e.stopPropagation()}
        className="mx-auto max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">{formatShort(date)}</h3>
          <button onClick={onClose} className="text-sm text-ink/70">
            Close
          </button>
        </div>

        <section className="mb-5">
          <button
            onClick={() => setMissed((m) => !m)}
            aria-pressed={missed}
            className={`w-full rounded-xl py-2 text-sm ${
              missed ? 'bg-rose-deep text-white' : 'bg-rose-soft/50 text-ink'
            }`}
          >
            {missed ? 'Marked as a missed period' : "My period didn't come"}
          </button>
        </section>

        <section className="mb-5">
          <p className="mb-2 text-sm text-ink/70">Flow</p>
          <div className="grid grid-cols-4 gap-2">
            {FLOW_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setFlow(o.value)}
                className={`rounded-xl py-2 text-sm ${
                  flow === o.value ? 'bg-rose-deep text-white' : 'bg-rose-soft/50 text-ink'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-5">
          <p className="mb-2 text-sm text-ink/70">Pain</p>
          <div className="grid grid-cols-4 gap-2">
            {PAIN_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setPain(o.value)}
                className={`rounded-xl py-2 text-sm ${
                  pain === o.value ? 'bg-lavender-deep text-white' : 'bg-lavender-soft/60 text-ink'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <p className="mb-2 text-sm text-ink/70">Symptoms</p>
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_OPTIONS.map((o) => {
              const on = symptoms.includes(o.value);
              return (
                <button
                  key={o.value}
                  onClick={() => toggleSymptom(o.value)}
                  aria-pressed={on}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    on ? 'bg-lavender-deep text-white' : 'bg-lavender-soft/60 text-ink'
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </section>

        <button onClick={save} className="w-full rounded-2xl bg-rose-deep py-3 font-semibold text-white">
          Save
        </button>
      </div>
    </div>
  );
}
