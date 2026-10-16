'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/adminAuth';
import { formatPrice } from '@/lib/format';
import { downloadCSV } from '@/lib/csvExport';
import { Banknote, X, Subscription, Download, Search } from '@/components/icons';

interface Order {
  id: string;
  order_number: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  total_paise: number;
  coupon_code?: string | null;
  discount_paise?: number;
  payment_method?: string;
  payment_status: string;
  fulfillment_status: string;
  created_at: string;
}

interface OrderItem {
  product_name: string;
  variant_label: string;
  quantity: number;
  price_paise: number;
  subscription_trays?: number | null;
  subscription_weeks?: number | null;
}

interface OrderDetail extends Order {
  delivery_address: string;
  delivery_pincode: string;
  subtotal_paise?: number;
  delivery_fee_paise?: number;
  discount_paise?: number;
  coupon_code?: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  items: OrderItem[];
}

const statusColors: Record<string, string> = {
  paid: 'bg-green-50 text-green-700',
  pending: 'bg-yellow-50 text-yellow-700',
  cod_pending: 'bg-amber-100 text-amber-900 border border-amber-300 font-medium',
  failed: 'bg-red-50 text-red-700',
  unfulfilled: 'bg-yellow-50 text-yellow-700',
  fulfilled: 'bg-blue-50 text-blue-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('');
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadOrders = useCallback(async () => {
    const params = new URLSearchParams();
    if (paymentFilter) params.set('payment_status', paymentFilter);
    if (fulfillmentFilter) params.set('fulfillment_status', fulfillmentFilter);
    const res = await adminFetch(`/api/admin/orders?${params}`);
    if (res.ok) setOrders(await res.json());
  }, [paymentFilter, fulfillmentFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openDetail = async (id: string) => {
    const res = await adminFetch(`/api/admin/orders/${id}`);
    if (res.ok) setDetail(await res.json());
  };

  const updateFulfillment = async (status: string) => {
    if (!detail) return;
    setSaving(true);
    const res = await adminFetch(`/api/admin/orders/${detail.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fulfillment_status: status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setDetail({ ...detail, fulfillment_status: updated.fulfillment_status });
      loadOrders();
    }
    setSaving(false);
  };

  const markCashCollected = async () => {
    if (!detail) return;
    setSaving(true);
    const res = await adminFetch(`/api/admin/orders/${detail.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_cash_collected' }),
    });
    if (res.ok) {
      const updated = await res.json();
      setDetail({ ...detail, payment_status: updated.payment_status });
      loadOrders();
    }
    setSaving(false);
  };

  const cancelOrder = async () => {
    if (!detail) return;
    if (!confirm('Are you sure you want to cancel this order? Any decremented stock will be restored.')) return;
    setSaving(true);
    const res = await adminFetch(`/api/admin/orders/${detail.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    });
    if (res.ok) {
      const updated = await res.json();
      setDetail({ ...detail, fulfillment_status: updated.fulfillment_status });
      loadOrders();
    }
    setSaving(false);
  };

  if (detail) {
    return (
      <div>
        <button
          onClick={() => setDetail(null)}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          &larr; Back to orders
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Order Detail</h1>

        {/* Order Number & Live Tracking Header */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800">Order Number</span>
            <div className="font-mono text-lg font-bold text-emerald-950 flex items-center gap-2 mt-0.5">
              {detail.order_number || <span className="font-sans text-sm text-gray-400 font-normal">Legacy (No Order #)</span>}
              {detail.order_number && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(detail.order_number!);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-xs bg-white text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="Copy Order Number"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              )}
            </div>
          </div>
          {detail.order_number && (
            <a
              href={`/track-order?order_number=${encodeURIComponent(detail.order_number)}&phone=${encodeURIComponent(detail.customer_phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-white bg-[#1C3F2D] hover:bg-[#122A1F] px-4 py-2 rounded-lg transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>View Live Tracking</span>
              <span>↗</span>
            </a>
          )}
        </div>

        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <span className="text-gray-500">Customer:</span>
              <span className="ml-2 font-medium">{detail.customer_name}</span>
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>
              <span className="ml-2">{detail.customer_phone}</span>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <span className="ml-2">{detail.customer_email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Subtotal:</span>
              <span className="ml-2 font-medium">
                {formatPrice(detail.subtotal_paise ?? (detail.total_paise - (detail.delivery_fee_paise || 0)))}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Delivery Fee:</span>
              <span className="ml-2 font-medium">
                {detail.delivery_fee_paise && detail.delivery_fee_paise > 0
                  ? formatPrice(detail.delivery_fee_paise)
                  : 'Free'}
              </span>
            </div>
            {detail.discount_paise && detail.discount_paise > 0 ? (
              <div>
                <span className="text-gray-500">Coupon Discount:</span>
                <span className="ml-2 font-medium text-emerald-700">
                  -{formatPrice(detail.discount_paise)} {detail.coupon_code ? `(${detail.coupon_code})` : ''}
                </span>
              </div>
            ) : null}
            <div>
              <span className="text-gray-500">Total:</span>
              <span className="ml-2 font-bold text-green-700">
                {formatPrice(detail.total_paise)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Address:</span>
              <span className="ml-2">
                {detail.delivery_address}, {detail.delivery_pincode}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Payment:</span>
              <span
                className={`ml-2 text-xs font-medium px-2 py-1 rounded-full ${
                  statusColors[detail.payment_status] || 'bg-gray-100'
                }`}
              >
                {detail.payment_status}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Method:</span>
              <span
                className={`ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  detail.payment_method === 'cod'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-sky-50 text-sky-800 border border-sky-200'
                }`}
              >
                {detail.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Online (Razorpay)'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Created:</span>
              <span className="ml-2">{new Date(detail.created_at).toLocaleString()}</span>
            </div>
            {detail.razorpay_payment_id && (
              <div>
                <span className="text-gray-500">Razorpay ID:</span>
                <span className="ml-2 font-mono text-xs">{detail.razorpay_payment_id}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Fulfillment Status:</span>
              <select
                value={detail.fulfillment_status}
                onChange={(e) => updateFulfillment(e.target.value)}
                disabled={saving}
                className="px-3 py-2 border rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-[#1C3F2D] outline-none"
              >
                <option value="unfulfilled">Unfulfilled (Harvesting / Processing)</option>
                <option value="fulfilled">Fulfilled (Harvested & Packed)</option>
                <option value="shipped">Shipped (Out for Delivery)</option>
                <option value="delivered">Delivered (Doorstep)</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {saving && <span className="text-xs text-gray-400">Saving update...</span>}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {detail.payment_method === 'cod' && detail.payment_status === 'cod_pending' && (
                <button
                  type="button"
                  onClick={markCashCollected}
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Banknote className="w-4 h-4" />
                  <span>Mark Cash Collected</span>
                </button>
              )}

              {detail.fulfillment_status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={cancelOrder}
                  disabled={saving}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 border border-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel / Refused</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4 sm:p-6 overflow-x-auto">
          <h2 className="font-bold text-gray-900 mb-3">Line Items</h2>
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Product</th>
                <th className="pb-2">Variant</th>
                <th className="pb-2 text-right">Qty</th>
                <th className="pb-2 text-right">Price</th>
                <th className="pb-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {detail.items.map((item, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2">{item.product_name}</td>
                  <td className="py-2">
                    <div>{item.variant_label}</div>
                    {item.subscription_trays && item.subscription_weeks && (
                      <span className="inline-flex items-center gap-1 mt-0.5 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                        <Subscription className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Subscription: {item.subscription_trays} {item.subscription_trays === 1 ? 'tray' : 'trays'}/wk · {item.subscription_weeks} wks</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 text-right">{formatPrice(item.price_paise)}</td>
                  <td className="py-2 text-right font-medium">
                    {formatPrice(item.price_paise * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (o.order_number && o.order_number.toLowerCase().includes(q)) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_phone.includes(q) ||
      (o.customer_email && o.customer_email.toLowerCase().includes(q))
    );
  });

  const handleExportCSV = () => {
    const headers = [
      'S. no.',
      'Order Number',
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Total (INR)',
      'Payment Status',
      'Fulfillment Status',
      'Created At',
    ];

    const rows = filteredOrders.map((o, idx) => [
      idx + 1,
      o.order_number || '',
      o.customer_name,
      o.customer_phone,
      o.customer_email || '',
      (o.total_paise / 100).toFixed(2),
      o.payment_status,
      o.fulfillment_status,
      new Date(o.created_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }),
    ]);

    downloadCSV('wga-orders.csv', [headers, ...rows]);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage harvest orders, payment statuses, and fulfillment dispatches.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={filteredOrders.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by Order #, Customer, Phone, or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1C3F2D] focus:border-[#1C3F2D] bg-white"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">
            <Search className="w-4 h-4 text-gray-400" />
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">All payment statuses</option>
            <option value="paid">Paid</option>
            <option value="cod_pending">COD Pending</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select
            value={fulfillmentFilter}
            onChange={(e) => setFulfillmentFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            <option value="">All fulfillment statuses</option>
            <option value="unfulfilled">Unfulfilled</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto shadow-xs">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50/80">
              <th className="px-3 py-3 w-14 text-center">S. no.</th>
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Fulfillment</th>
              <th className="px-4 py-3">Date &amp; Time</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((o, idx) => (
              <tr
                key={o.id}
                className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => openDetail(o.id)}
              >
                <td className="px-3 py-3 text-center font-mono text-xs text-gray-500 font-medium">
                  {idx + 1}
                </td>
                <td className="px-4 py-3 font-mono font-bold text-xs text-emerald-800">
                  {o.order_number || <span className="text-gray-400 font-sans font-normal">—</span>}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{o.customer_name}</td>
                <td className="px-4 py-3 text-gray-600 text-xs font-mono">{o.customer_phone}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">{formatPrice(o.total_paise)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1 items-start">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        o.payment_method === 'cod'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-sky-50 text-sky-800 border border-sky-200'
                      }`}
                    >
                      {o.payment_method === 'cod' ? 'COD' : 'Online'}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        statusColors[o.payment_status] || 'bg-gray-100'
                      }`}
                    >
                      {o.payment_status}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      statusColors[o.fulfillment_status] || 'bg-gray-100'
                    }`}
                  >
                    {o.fulfillment_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                  <div>
                    {new Date(o.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono">
                    {new Date(o.created_at).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </div>
                </td>
                <td className="px-4 py-3 text-emerald-700 font-semibold text-xs hover:underline">
                  View →
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredOrders.length === 0 && (
          <p className="p-8 text-center text-gray-400 text-sm">
            {searchQuery ? `No orders matching "${searchQuery}"` : 'No orders found'}
          </p>
        )}
      </div>
    </div>
  );
}
