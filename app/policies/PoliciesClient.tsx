'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PoliciesClient() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('privacy')) {
      router.replace('/privacy-policy');
    } else if (hash.includes('shipping') || hash.includes('return')) {
      router.replace('/shipping-and-returns');
    } else {
      router.replace('/terms-and-conditions');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-white pt-40 text-center text-sm text-[#151F19]/60">
      Redirecting to policy...
    </div>
  );
}
