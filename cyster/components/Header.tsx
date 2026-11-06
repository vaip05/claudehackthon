'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { currentName, signOut, subscribeSession } from '@/lib/auth';
import { wipeAll } from '@/lib/storage';

const NAV = [
  { href: '/track', label: 'Track' },
  { href: '/talk', label: 'Talk' },
  { href: '/tips', label: 'Tips' },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const name = useSyncExternalStore(subscribeSession, currentName, () => null);

  const onDelete = () => {
    const ok = window.confirm(
      'Delete everything Cyster has saved on this device, for every profile? This cannot be undone.',
    );
    if (!ok) return;
    wipeAll();
    window.location.reload();
  };

  const onSignOut = () => {
    signOut();
    router.push('/');
  };

  return (
    <header className="no-print sticky top-0 z-10 h-[var(--header-h)] bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-5 md:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-semibold text-lavender-deep md:text-xl">
            Cyster
          </Link>
          {/* On phones the bottom tab bar does this job. */}
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-full px-4 py-1.5 text-sm transition ${
                    active
                      ? 'bg-lavender-soft font-semibold text-rose-deep'
                      : 'text-ink/70 hover:bg-lavender-soft/60'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-xs text-ink/60 md:text-sm">
          {name && (
            <>
              <span className="max-w-[9rem] truncate md:max-w-xs" title={name}>
                {name}
              </span>
              <button onClick={onSignOut} className="underline">
                Sign out
              </button>
            </>
          )}
          <button onClick={onDelete} className="underline">
            Delete everything
          </button>
        </div>
      </div>
    </header>
  );
}
