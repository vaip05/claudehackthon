'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useState, useSyncExternalStore, type FormEvent } from 'react';
import {
  MIN_PASSWORD_LENGTH,
  currentName,
  signIn,
  signOut,
  signUp,
  subscribeSession,
} from '@/lib/auth';

type Mode = 'signin' | 'signup';

const noopSubscribe = () => () => {};

const inputClass =
  'w-full rounded-xl border border-lavender-soft bg-white px-4 py-3 text-ink placeholder:text-ink/40 outline-none focus:border-lavender-deep focus:ring-2 focus:ring-lavender-soft';

/** Sign in or create an account. Accounts live on this device only (see lib/auth.ts). */
export default function AuthCard() {
  const router = useRouter();
  const ids = { email: useId(), password: useId(), confirm: useId() };

  // The session lives in localStorage, so the server can't know it. Render a neutral card until the client has hydrated.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const email = useSyncExternalStore(subscribeSession, currentName, () => null);

  const [mode, setMode] = useState<Mode>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setError(null);
    setConfirm('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const result =
      mode === 'signin'
        ? await signIn(emailInput, password)
        : await signUp(emailInput, password, confirm);
    setBusy(false);
    if (result.ok) {
      // The homepage stays mounted while you use the app, so leave the card clean for the next sign-in.
      setEmailInput('');
      setPassword('');
      setConfirm('');
      setShowPassword(false);
      setMode('signin');
      router.push('/track');
    } else {
      setError(result.error);
    }
  };

  if (!hydrated) {
    return <section aria-hidden="true" className="min-h-72 rounded-3xl bg-lavender-soft/50" />;
  }

  if (email) {
    return (
      <section className="space-y-3 rounded-3xl bg-lavender-soft/50 p-6 text-center">
        <p>
          Welcome back, <span className="break-all font-semibold">{email}</span>
        </p>
        <Link href="/track" className="block rounded-2xl bg-rose-deep py-3 font-semibold text-white">
          Go to Track
        </Link>
        <button onClick={() => signOut()} className="text-sm text-ink/60 underline">
          Sign out
        </button>
      </section>
    );
  }

  const isSignUp = mode === 'signup';

  return (
    <section aria-label="Account" className="rounded-3xl bg-lavender-soft/50 p-6">
      <div role="group" aria-label="Sign in or create an account" className="grid grid-cols-2 gap-1 rounded-full bg-white/70 p-1">
        {(['signin', 'signup'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => switchMode(m)}
            className={`rounded-full px-3 py-2 text-sm transition ${
              mode === m ? 'bg-white font-semibold text-rose-deep shadow-sm' : 'text-ink/70'
            }`}
          >
            {m === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <h2 className="text-lg font-semibold">{isSignUp ? 'Create your account' : 'Welcome back'}</h2>

        <div className="space-y-1.5">
          <label htmlFor={ids.email} className="text-sm font-medium">
            Email
          </label>
          <input
            id={ids.email}
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="you@example.com"
            autoComplete="username"
            inputMode="email"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={ids.password} className="text-sm font-medium">
            Password
          </label>
          <input
            id={ids.password}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignUp ? `At least ${MIN_PASSWORD_LENGTH} characters` : 'Your password'}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            className={inputClass}
          />
        </div>

        {isSignUp && (
          <div className="space-y-1.5">
            <label htmlFor={ids.confirm} className="text-sm font-medium">
              Confirm password
            </label>
            <input
              id={ids.confirm}
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Type it again"
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-ink/70">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="h-4 w-4 accent-lavender-deep"
          />
          Show password
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-rose-soft/70 px-3 py-2 text-sm text-rose-deep">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-rose-deep py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? (isSignUp ? 'Creating account…' : 'Signing in…') : isSignUp ? 'Create account' : 'Sign in'}
        </button>

        <p className="text-center text-sm text-ink/70">
          {isSignUp ? 'Already have an account? ' : 'New here? '}
          <button
            type="button"
            onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
            className="font-medium text-lavender-deep underline"
          >
            {isSignUp ? 'Sign in' : 'Create an account'}
          </button>
        </p>

        <p className="text-xs leading-relaxed text-ink/60">
          Your account is saved only on this device. We never receive your email or password, and we can&apos;t
          reset a forgotten one. If that happens, &ldquo;Delete everything&rdquo; at the top lets you start over.
        </p>
      </form>
    </section>
  );
}
