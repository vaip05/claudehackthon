'use client';

import { wipeAll } from '@/lib/storage';

export default function Header() {
  const onDelete = () => {
    const ok = window.confirm(
      'Delete everything Cyster has saved on this device? This cannot be undone.',
    );
    if (!ok) return;
    wipeAll();
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-cream/90 px-5 py-4 backdrop-blur">
      <span className="text-lg font-semibold text-lavender-deep">Cyster</span>
      <button onClick={onDelete} className="text-xs text-ink/60 underline">
        Delete everything
      </button>
    </header>
  );
}
