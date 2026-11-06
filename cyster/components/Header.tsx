'use client';

import { useRouter } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { currentName, signOut, subscribeSession } from '@/lib/auth';
import { wipeAll } from '@/lib/storage';

export default function Header() {
  const router = useRouter();
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
    <header className="sticky top-0 z-10 flex items-center justify-between bg-cream/90 px-5 py-4 backdrop-blur">
      <span className="text-lg font-semibold text-lavender-deep">Cyster</span>
      <div className="flex items-center gap-4 text-xs text-ink/60">
        {name && (
          <>
            <span>{name}</span>
            <button onClick={onSignOut} className="underline">
              Sign out
            </button>
          </>
        )}
        <button onClick={onDelete} className="underline">
          Delete everything
        </button>
      </div>
    </header>
  );
}
