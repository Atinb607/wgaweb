'use client';

import dynamic from 'next/dynamic';

const CartDrawer = dynamic(() => import('@/components/CartDrawer'), {
  ssr: false,
});

export default function ClientCartDrawer() {
  return <CartDrawer />;
}
