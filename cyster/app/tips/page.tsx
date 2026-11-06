import type { Metadata } from 'next';
import Tips from '@/components/Tips';

export const metadata: Metadata = {
  title: 'Tips',
};

export default function TipsPage() {
  return <Tips />;
}
