'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/track', label: 'Track' },
  { href: '/talk', label: 'Talk' },
  { href: '/tips', label: 'Tips' },
];

export default function TabBar() {
  const pathname = usePathname();
  if (pathname === '/') return null; // homepage has its own navigation

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-lavender-soft bg-white/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`block py-3 text-center text-sm ${
                  active ? 'font-semibold text-rose-deep' : 'text-ink/60'
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
