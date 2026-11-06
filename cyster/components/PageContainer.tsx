import type { ReactNode } from 'react';

/** Shared page width: a phone-width gutter on small screens, a centred wide column on desktop. */
export default function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 pb-6 pt-2 md:px-8 md:pb-10 md:pt-6">
      {children}
    </div>
  );
}
