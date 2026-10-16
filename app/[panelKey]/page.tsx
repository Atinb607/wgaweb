'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/adminAuth';
import { formatPrice } from '@/lib/format';
import { AlertTriangle } from '@/components/icons';

interface LowStockVariant {
  id: string;
  label: string;
  stock_qty: number;
  product_name: string;
}

interface Stats {
  orders_today_count: number;
  orders_today_revenue_paise: number;
  pending_fulfillment_count: number;
  low_stock_variants: LowStockVariant[];
  newsletter_subscriber_count: number;
  new_inquiry_count: number;
  stale_pending_orders_count: number;
  coupon_requests_new_count: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    adminFetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) {
    return <p className="text-gray-400">Loading dashboard...</p>;
  }

  const cards = [
    { label: 'Orders Today', value: stats.orders_today_count, color: 'bg-blue-50 text-blue-700' },
    { label: 'Revenue Today', value: formatPrice(stats.orders_today_revenue_paise), color: 'bg-green-50 text-green-700' },
    { label: 'Pending Fulfillment', value: stats.pending_fulfillment_count, color: 'bg-amber-50 text-amber-700' },
    { label: 'Low Stock Variants', value: stats.low_stock_variants.length, color: 'bg-red-50 text-red-700' },
    { label: 'Newsletter Subscribers', value: stats.newsletter_subscriber_count, color: 'bg-purple-50 text-purple-700' },
    { label: 'New Code Requests', value: stats.coupon_requests_new_count ?? 0, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Stale Pending Orders', value: stats.stale_pending_orders_count, color: 'bg-orange-50 text-orange-700' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl p-5 ${c.color}`}>
            <p className="text-sm font-medium opacity-75">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {stats.low_stock_variants.length > 0 && (
        <div className="bg-white rounded-xl border p-4 sm:p-5 overflow-x-auto">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 inline shrink-0" />
            <span>Low Stock Variants</span>
          </h2>
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Product</th>
                <th className="pb-2">Variant</th>
                <th className="pb-2 text-right">Stock</th>
              </tr>
            </thead>
            <tbody>
              {stats.low_stock_variants.map((v) => (
                <tr key={v.id} className="border-b last:border-0">
                  <td className="py-2">{v.product_name}</td>
                  <td className="py-2">{v.label}</td>
                  <td className="py-2 text-right font-bold text-red-600">{v.stock_qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
