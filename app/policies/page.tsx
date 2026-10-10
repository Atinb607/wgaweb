import { Suspense } from 'react';
import PoliciesClient from './PoliciesClient';

export const metadata = {
  title: 'Company Policies | Wild About Greens',
  description: 'Terms and Conditions, Privacy Policy, and Shipping & Returns guidelines for Wild About Greens.',
};

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
