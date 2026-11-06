import type { Metadata } from 'next';
import PageContainer from '@/components/PageContainer';
import Tips from '@/components/Tips';

export const metadata: Metadata = {
  title: 'Tips',
};

export default function TipsPage() {
  return (
    <PageContainer>
      <Tips />
    </PageContainer>
  );
}
