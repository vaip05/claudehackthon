'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';
import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore, type FormEvent } from 'react';
import { currentName, signIn, signOut, subscribeSession } from '@/lib/auth';

const PILLARS = [
  {
    title: 'Track',
    href: '/track',
    body: 'Log your cycle and see your phase, your next period, and what your pattern might be telling you.',
  },
  {
    title: 'Talk',
    href: '/talk',
    body: 'Say what’s going on in your own words, and upload a report if you have one. No judgment.',
  },
  {
    title: 'Tips',
    href: '/tips',
    body: 'Eat, move and rest in a way that fits where you are in your cycle.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const name = useSyncExternalStore(subscribeSession, currentName, () => null);
  const [nameInput, setNameInput] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await signIn(nameInput, pin);
    setBusy(false);
    if (result.ok) router.push('/track');
    else setError(result.error);
  };

  return (
    <div className="flex flex-1 flex-col gap-10 py-8">
      <section className="space-y-3 text-center">
        <Logo size={64} className="justify-center" />
        <h1 className="text-3xl font-semibold leading-tight">Track it. Talk it. Tips for feeling your best.</h1>
        <p className="text-sm text-ink/70">
          A private space for periods, PMOS and endometriosis questions, and everyday tips for your body.
        </p>
      </section>

      <section className="grid gap-4">
        {PILLARS.map((p) => (
          <Link
            key={p.title}
            href={p.href}
            className="rounded-3xl bg-white p-5 shadow-sm transition hover:bg-rose-soft/40"
          >
            <h2 className="font-semibold text-rose-deep">{p.title}</h2>
            <p className="mt-1 text-sm text-ink/70">{p.body}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-3xl bg-lavender-soft/50 p-6">
        {name ? (
          <div className="space-y-3 text-center">
            <p>
              Welcome back, <span className="font-semibold">{name}</span>
            </p>
            <Link href="/track" className="block rounded-2xl bg-rose-deep py-3 font-semibold text-white">
              Go to Track
            </Link>
            <button
              onClick={() => signOut()}
              className="text-sm text-ink/70 underline"
            >
              Sign out
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <h2 className="font-semibold">Sign in</h2>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Name or nickname"
              autoComplete="username"
              className="w-full rounded-xl border border-lavender-soft bg-white px-4 py-3"
            />
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4-digit PIN"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              className="w-full rounded-xl border border-lavender-soft bg-white px-4 py-3 tracking-[0.5em]"
            />
            {error && (
              <p role="alert" className="text-sm text-rose-deep">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-2xl bg-rose-deep py-3 font-semibold text-white disabled:opacity-60"
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
            <p className="text-xs text-ink/70">
              New here? Pick a name and PIN and we&apos;ll create your profile on this device.
            </p>
          </form>
        )}
      </section>
    </div>
  );
}
