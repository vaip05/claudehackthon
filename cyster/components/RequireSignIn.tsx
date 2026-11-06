'use client';

import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionId, subscribeSession } from '@/lib/auth';

/** Sends anyone who isn't signed in back to the homepage. */
export default function RequireSignIn({ children }: { children: ReactNode }) {
  const router = useRouter();
  const signedIn = useSyncExternalStore(subscribeSession, () => !!getSessionId(), () => false);

  useEffect(() => {
    if (!getSessionId()) router.replace('/');
  }, [router]);

  if (!signedIn) return null;
  return <>{children}</>;
}
