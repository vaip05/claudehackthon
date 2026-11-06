import { Suspense } from 'react';
import type { Metadata } from 'next';
import Talk from '@/components/Talk';
export const metadata: Metadata = {
  title: 'Talk',
};

export default function TalkPage() {
  // useSearchParams (for ?q=) needs a Suspense boundary when the page is prerendered.
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <Talk />
    </Suspense>
  );
}
