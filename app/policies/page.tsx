import { Suspense } from 'react';
import type { Metadata } from 'next';
import PoliciesClient from './PoliciesClient';
import { buildPageMetadata } from '@/lib/seo';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Store Policies · Privacy, Terms & Shipping',
    description:
      'Read Wild About Greens policies covering privacy, terms and conditions, shipping, delivery schedules, returns and freshness guarantees in Tricity.',
    path: '/policies',
  });
}

export default function PoliciesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white pt-40 text-center text-sm text-[#151F19]/60">
          Loading policies...
        </div>
      }
    >
      <PoliciesClient />
    </Suspense>
  );
}
