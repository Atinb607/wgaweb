'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/adminAuth';
import { formatPrice } from '@/lib/format';
import { Tag, Clipboard, Check, Plus } from '@/components/icons';

interface CouponCodeItem {
  id: string;
  code: string;
  percent_off: number;
  status: 'active' | 'disabled' | 'void';
  created_at: string;
  updated_at: string;
  times_used: number;
  total_discount_paise: number;
}

interface CouponRequestItem {
  id: string;
  email: string;
  email_normalized: string;
  source: string | null;
  status: 'new' | 'sent' | 'dismissed';
  created_at: string;
  handled_at: string | null;
}

const couponStatusBadges: Record<
  CouponCodeItem['status'],
  { label: string; className: string }
> = {
  active: {
    label: 'Active',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  disabled: {
    label: 'Disabled',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  void: {
    label: 'Void',
    className: 'bg-gray-100 text-gray-600 border-gray-300',
  },
};

const requestStatusBadges: Record<
  CouponRequestItem['status'],
  { label: string; className: string }
> = {
  new: {
    label: 'New',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  sent: {
    label: 'Sent',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  dismissed: {
    label: 'Dismissed',
    className: 'bg-gray-100 text-gray-600 border-gray-300',
  },
};

export default function AdminCouponsPage() {
  const [activeTab, setActiveTab] = useState<'codes' | 'requests'>('codes');

  // ── Coupon Codes State ──
  const [coupons, setCoupons] = useState<CouponCodeItem[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [newPercentOff, setNewPercentOff] = useState('15');
  const [creatingCode, setCreatingCode] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [updatingCouponId, setUpdatingCouponId] = useState<string | null>(null);
  const [confirmVoidCoupon, setConfirmVoidCoupon] = useState<CouponCodeItem | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // ── Code Requests State ──
  const [requests, setRequests] = useState<CouponRequestItem[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('');
  const [requestPage, setRequestPage] = useState(1);
  const [requestTotalPages, setRequestTotalPages] = useState(1);
  const [requestTotal, setRequestTotal] = useState(0);
  const [newRequestCount, setNewRequestCount] = useState(0);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  const loadCoupons = useCallback(async () => {
    setCouponsLoading(true);
    try {
      const res = await adminFetch(`/api/admin/coupons?_t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setCouponsLoading(false);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const params = new URLSearchParams();
      if (requestStatusFilter) params.set('status', requestStatusFilter);
      params.set('page', String(requestPage));
      params.set('limit', '25');
      params.set('_t', String(Date.now()));

      const res = await adminFetch(`/api/admin/coupon-requests?${params.toString()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data.requests) ? data.requests : []);
        setRequestTotal(Number(data.total ?? 0));
        setRequestTotalPages(Number(data.totalPages ?? 1));
        setNewRequestCount(Number(data.new_count ?? 0));
      }
    } catch (err) {
      console.error('Failed to load coupon requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  }, [requestStatusFilter, requestPage]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  // ── Coupon Codes Handlers ──
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const trimmedCode = newCode.trim().toUpperCase();
    const pct = Number(newPercentOff);

    if (!/^[A-Z0-9-]{3,20}$/.test(trimmedCode)) {
      setCreateError(
        'Code must be 3–20 characters and contain only A-Z, 0-9, and hyphens (-).'
      );
      return;
    }
    if (!Number.isInteger(pct) || pct < 1 || pct > 90) {
      setCreateError('Percent off must be a whole number between 1 and 90.');
      return;
    }

    setCreatingCode(true);
    try {
      const res = await adminFetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmedCode, percent_off: pct }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setNewCode('');
        setNewPercentOff('15');
        showFeedback(`Created coupon code ${data.code} (${data.percent_off}% off).`);
        loadCoupons();
      } else {
        setCreateError(data.error || 'Failed to create coupon code.');
      }
    } catch {
      setCreateError('Network error while creating coupon code.');
    } finally {
      setCreatingCode(false);
    }
  };

  const handleToggleCouponStatus = async (coupon: CouponCodeItem) => {
    if (coupon.status === 'void') return;
    const nextStatus = coupon.status === 'active' ? 'disabled' : 'active';
    setUpdatingCouponId(coupon.id);
    try {
      const res = await adminFetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, status: data.status } : c))
        );
        showFeedback(
          `Coupon ${coupon.code} is now ${nextStatus === 'active' ? 'active' : 'disabled'}.`
        );
      } else {
        showFeedback(data.error || 'Failed to update coupon status.', 'error');
      }
    } catch {
      showFeedback('Network error while updating coupon.', 'error');
    } finally {
      setUpdatingCouponId(null);
    }
  };

  const handleConfirmVoid = async () => {
    if (!confirmVoidCoupon) return;
    const target = confirmVoidCoupon;
    setUpdatingCouponId(target.id);
    try {
      const res = await adminFetch(`/api/admin/coupons/${target.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'void' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === target.id ? { ...c, status: 'void' } : c))
        );
        showFeedback(`Coupon ${target.code} has been permanently voided.`);
        setConfirmVoidCoupon(null);
      } else {
        showFeedback(data.error || 'Failed to void coupon.', 'error');
      }
    } catch {
      showFeedback('Network error while voiding coupon.', 'error');
    } finally {
      setUpdatingCouponId(null);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // ── Code Requests Handlers ──
  const handleCopyEmail = (reqItem: CouponRequestItem) => {
    navigator.clipboard.writeText(reqItem.email);
    setCopiedEmailId(reqItem.id);
    setTimeout(() => setCopiedEmailId(null), 2000);
  };

  const handleUpdateRequestStatus = async (
    reqItem: CouponRequestItem,
    nextStatus: 'sent' | 'dismissed' | 'new'
  ) => {
    setUpdatingRequestId(reqItem.id);
    try {
      const res = await adminFetch(`/api/admin/coupon-requests/${reqItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // Immediately update state so UI never reverts to stale cached state
        setRequests((prev) =>
          prev.map((r) =>
            r.id === reqItem.id
              ? {
                  ...r,
                  status: nextStatus,
                  handled_at: (data && data.handled_at) || new Date().toISOString(),
                }
              : r
          )
        );
        if (reqItem.status === 'new' && nextStatus !== 'new') {
          setNewRequestCount((prev) => Math.max(0, prev - 1));
        } else if (reqItem.status !== 'new' && nextStatus === 'new') {
          setNewRequestCount((prev) => prev + 1);
        }
        showFeedback(`Marked ${reqItem.email} as ${nextStatus}.`);
        await loadRequests();
      } else {
        showFeedback(data.error || 'Failed to update request.', 'error');
      }
    } catch {
      showFeedback('Network error while updating request.', 'error');
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const handleDeleteRequest = async (reqItem: CouponRequestItem) => {
    setUpdatingRequestId(reqItem.id);
    try {
      const res = await adminFetch(`/api/admin/coupon-requests/${reqItem.id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== reqItem.id));
        setRequestTotal((prev) => Math.max(0, prev - 1));
        if (reqItem.status === 'new') {
          setNewRequestCount((prev) => Math.max(0, prev - 1));
        }
        showFeedback(`Deleted request for ${reqItem.email}.`);
        await loadRequests();
      } else {
        showFeedback(data.error || 'Failed to delete request.', 'error');
      }
    } catch {
      showFeedback('Network error while deleting request.', 'error');
    } finally {
      setUpdatingRequestId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1C3F2D] flex items-center gap-2">
            <Tag className="w-6 h-6 text-[#1C3F2D]" />
            Coupons
          </h1>
          <p className="text-sm text-[#151F19]/60 mt-1">
            Manage shared discount codes and review customer 15% promo code requests.
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm font-medium transition-all ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Two Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E4DDC8]">
        <button
          type="button"
          onClick={() => {
            setActiveTab('codes');
            loadCoupons();
          }}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'codes'
              ? 'border-[#1C3F2D] text-[#1C3F2D]'
              : 'border-transparent text-[#151F19]/60 hover:text-[#151F19]'
          }`}
        >
          Coupon codes
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('requests');
            loadRequests();
          }}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'requests'
              ? 'border-[#1C3F2D] text-[#1C3F2D]'
              : 'border-transparent text-[#151F19]/60 hover:text-[#151F19]'
          }`}
        >
          <span>Code requests</span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              newRequestCount > 0
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {newRequestCount}
          </span>
        </button>
      </div>

      {/* ================= TAB 1: COUPON CODES ================= */}
      {activeTab === 'codes' && (
        <div className="space-y-6">
          {/* Create Coupon Form */}
          <div className="bg-white p-5 rounded-2xl border border-[#E4DDC8]/80 shadow-sm">
            <h2 className="text-sm font-bold text-[#1C3F2D] uppercase tracking-wider mb-3">
              Create Coupon Code
            </h2>
            <form
              onSubmit={handleCreateCoupon}
              className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
            >
              <div className="flex-1">
                <label className="block text-xs font-semibold text-[#151F19]/70 mb-1">
                  Code (A–Z, 0–9, hyphen, 3–20 chars)
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => {
                    setNewCode(e.target.value.toUpperCase());
                    setCreateError(null);
                  }}
                  placeholder="e.g. WAG15"
                  maxLength={20}
                  required
                  className="w-full px-3.5 py-2 text-sm font-mono uppercase rounded-xl border border-[#E4DDC8] bg-[#FAFAF7] focus:outline-none focus:ring-2 focus:ring-[#1C3F2D]/20 focus:border-[#1C3F2D]"
                />
              </div>

              <div className="w-full sm:w-40">
                <label className="block text-xs font-semibold text-[#151F19]/70 mb-1">
                  Percent Off (1–90%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={newPercentOff}
                  onChange={(e) => {
                    setNewPercentOff(e.target.value);
                    setCreateError(null);
                  }}
                  required
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E4DDC8] bg-[#FAFAF7] focus:outline-none focus:ring-2 focus:ring-[#1C3F2D]/20 focus:border-[#1C3F2D]"
                />
              </div>

              <button
                type="submit"
                disabled={creatingCode}
                className="px-5 py-2.5 bg-[#1C3F2D] hover:bg-[#122A1F] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{creatingCode ? 'Creating...' : 'Create Code'}</span>
              </button>
            </form>

            {createError && (
              <p className="text-xs font-semibold text-rose-600 mt-2.5">{createError}</p>
            )}
          </div>

          {/* Permanent Void Confirmation Modal */}
          {confirmVoidCoupon && (
            <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-rose-900">
                  Void coupon &ldquo;{confirmVoidCoupon.code}&rdquo; permanently?
                </h3>
                <p className="text-xs text-rose-800 mt-1">
                  This action is <strong>permanent</strong> and cannot be undone. Once voided,{' '}
                  <span className="font-mono font-bold">{confirmVoidCoupon.code}</span> can never
                  be re-enabled.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmVoidCoupon(null)}
                  disabled={updatingCouponId === confirmVoidCoupon.id}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVoid}
                  disabled={updatingCouponId === confirmVoidCoupon.id}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {updatingCouponId === confirmVoidCoupon.id
                    ? 'Voiding...'
                    : 'Yes, Void Permanently'}
                </button>
              </div>
            </div>
          )}

          {/* Coupon Codes Table */}
          <div className="bg-white rounded-2xl border border-[#E4DDC8]/80 shadow-sm overflow-hidden">
            {couponsLoading ? (
              <div className="p-12 text-center text-sm text-[#151F19]/50 animate-pulse">
                Loading coupon codes...
              </div>
            ) : coupons.length === 0 ? (
              <div className="p-12 text-center text-sm text-[#151F19]/60">
                No coupon codes created yet. Use the form above to create one (e.g. WAG15).
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#FAFAF7] border-b border-[#E4DDC8] text-xs font-semibold uppercase tracking-wider text-[#1C3F2D]">
                    <tr>
                      <th className="py-3.5 px-4">Code</th>
                      <th className="py-3.5 px-4">Percent</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Created Date</th>
                      <th className="py-3.5 px-4">Times Used</th>
                      <th className="py-3.5 px-4">Total Discount Given</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4DDC8]/60 text-xs sm:text-sm">
                    {coupons.map((coupon) => {
                      const badge = couponStatusBadges[coupon.status] || {
                        label: coupon.status,
                        className: 'bg-gray-100 text-gray-800 border-gray-200',
                      };
                      const isUpdating = updatingCouponId === coupon.id;

                      return (
                        <tr key={coupon.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#1C3F2D] text-sm">
                                {coupon.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(coupon.code)}
                                title="Copy code"
                                className="p-1 text-gray-400 hover:text-[#1C3F2D] rounded hover:bg-gray-100 transition-colors cursor-pointer"
                              >
                                {copiedCode === coupon.code ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Clipboard className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                              {coupon.percent_off}% OFF
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full border inline-block ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-[#151F19]/70">
                            {formatDate(coupon.created_at)}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-[#151F19]">
                            {coupon.times_used}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-[#1C3F2D]">
                            {formatPrice(coupon.total_discount_paise)}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-right">
                            {coupon.status !== 'void' ? (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleCouponStatus(coupon)}
                                  disabled={isUpdating}
                                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 cursor-pointer ${
                                    coupon.status === 'active'
                                      ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                                      : 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                                  }`}
                                >
                                  {coupon.status === 'active' ? 'Disable' : 'Enable'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmVoidCoupon(coupon)}
                                  disabled={isUpdating}
                                  className="text-xs font-semibold text-rose-700 hover:text-rose-900 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100 disabled:opacity-50 transition-colors cursor-pointer"
                                >
                                  Void
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">
                                Voided (Permanent)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: CODE REQUESTS ================= */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Status Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E4DDC8]/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[#151F19]/60 mr-1">Filter Status:</span>
              {[
                { value: '', label: 'All' },
                { value: 'new', label: 'New' },
                { value: 'sent', label: 'Sent' },
                { value: 'dismissed', label: 'Dismissed' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setRequestStatusFilter(opt.value);
                    setRequestPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    requestStatusFilter === opt.value
                      ? 'bg-[#1C3F2D] text-white border-[#1C3F2D]'
                      : 'bg-[#FAFAF7] text-[#151F19]/70 border-[#E4DDC8] hover:border-[#1C3F2D]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-[#151F19]/60 font-medium">
              Showing {requests.length} of {requestTotal} requests
            </div>
          </div>

          {/* Code Requests Table */}
          <div className="bg-white rounded-2xl border border-[#E4DDC8]/80 shadow-sm overflow-hidden">
            {requestsLoading ? (
              <div className="p-12 text-center text-sm text-[#151F19]/50 animate-pulse">
                Loading code requests...
              </div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center text-sm text-[#151F19]/60">
                No code requests found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#FAFAF7] border-b border-[#E4DDC8] text-xs font-semibold uppercase tracking-wider text-[#1C3F2D]">
                    <tr>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Requested Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4DDC8]/60 text-xs sm:text-sm">
                    {requests.map((reqItem) => {
                      const badge = requestStatusBadges[reqItem.status] || {
                        label: reqItem.status,
                        className: 'bg-gray-100 text-gray-700 border-gray-300',
                      };
                      const isUpdating = updatingRequestId === reqItem.id;

                      return (
                        <tr key={reqItem.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-[#122A1F] block">
                              {reqItem.email}
                            </span>
                            {reqItem.source && (
                              <span className="text-[11px] text-[#151F19]/45 block">
                                Source: {reqItem.source}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-[#151F19]/70">
                            {formatDate(reqItem.created_at)}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full border inline-block ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                              <button
                                type="button"
                                onClick={() => handleCopyEmail(reqItem)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#E4DDC8] bg-[#FAFAF7] hover:bg-gray-100 text-[#122A1F] inline-flex items-center gap-1 cursor-pointer"
                              >
                                {copiedEmailId === reqItem.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Clipboard className="w-3.5 h-3.5" />
                                    <span>Copy email</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                disabled={isUpdating || reqItem.status === 'sent'}
                                onClick={() => handleUpdateRequestStatus(reqItem, 'sent')}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 disabled:opacity-40 cursor-pointer"
                              >
                                Mark as sent
                              </button>

                              <button
                                type="button"
                                disabled={isUpdating || reqItem.status === 'dismissed'}
                                onClick={() => handleUpdateRequestStatus(reqItem, 'dismissed')}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                              >
                                Dismiss
                              </button>

                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleDeleteRequest(reqItem)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-40 cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            {requestTotalPages > 1 && (
              <div className="px-4 py-3 bg-[#FAFAF7] border-t border-[#E4DDC8] flex items-center justify-between text-xs">
                <span className="text-[#151F19]/60">
                  Page {requestPage} of {requestTotalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={requestPage <= 1}
                    onClick={() => setRequestPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-lg border border-[#E4DDC8] bg-white disabled:opacity-40 font-semibold cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={requestPage >= requestTotalPages}
                    onClick={() => setRequestPage((p) => Math.min(requestTotalPages, p + 1))}
                    className="px-3 py-1 rounded-lg border border-[#E4DDC8] bg-white disabled:opacity-40 font-semibold cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
