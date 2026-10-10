'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminAuth';
import { Sprout, Globe, Star } from '@/components/icons';

interface Review {
  id: string;
  product_id: string | null;
  product_name?: string | null;
  reviewer_name: string;
  reviewer_location: string | null;
  review_text: string;
  rating: number;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

interface ProductOption {
  id: string;
  name: string;
  slug: string;
}

const emptyReview = {
  product_id: '' as string,
  reviewer_name: '',
  reviewer_location: '',
  review_text: '',
  rating: 5,
  display_order: 0,
  is_active: true,
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState(emptyReview);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterProductId, setFilterProductId] = useState<string>('all');

  const loadReviews = useCallback(async () => {
    const res = await adminFetch('/api/admin/reviews');
    if (res.ok) {
      const data: Review[] = await res.json();
      setReviews(data);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    const res = await adminFetch('/api/admin/products');
    if (res.ok) {
      const data: ProductOption[] = await res.json();
      setProducts(data.map((p) => ({ id: p.id, name: p.name, slug: p.slug })));
    }
  }, []);

  useEffect(() => {
    loadReviews();
    loadProducts();
  }, [loadReviews, loadProducts]);

  const handleEdit = (rev: Review) => {
    setEditing(rev);
    setIsNew(false);
    setForm({
      product_id: rev.product_id || '',
      reviewer_name: rev.reviewer_name || '',
      reviewer_location: rev.reviewer_location || '',
      review_text: rev.review_text || '',
      rating: rev.rating || 5,
      display_order: rev.display_order ?? 0,
      is_active: rev.is_active ?? true,
    });
  };

  const handleNew = () => {
    setEditing(null);
    setIsNew(true);
    setForm({
      ...emptyReview,
      display_order: reviews.length + 1,
    });
  };

  const handleCancel = () => {
    setEditing(null);
    setIsNew(false);
    setForm(emptyReview);
  };

  const handleSave = async () => {
    if (!form.reviewer_name.trim() || !form.review_text.trim()) {
      alert('Please fill in both Reviewer Name and Review Text.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        product_id: form.product_id ? form.product_id : null,
      };

      if (isNew) {
        const res = await adminFetch('/api/admin/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          handleCancel();
          loadReviews();
        } else {
          const err = await res.json();
          alert(`Error saving review: ${err.error || 'Unknown error'}`);
        }
      } else if (editing) {
        const res = await adminFetch(`/api/admin/reviews/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          handleCancel();
          loadReviews();
        } else {
          const err = await res.json();
          alert(`Error updating review: ${err.error || 'Unknown error'}`);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    const res = await adminFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    if (res.ok) {
      if (editing?.id === id) handleCancel();
      loadReviews();
    }
  };

  const handleToggleActive = async (rev: Review) => {
    await adminFetch(`/api/admin/reviews/${rev.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !rev.is_active }),
    });
    loadReviews();
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterProductId === 'all') return true;
    if (filterProductId === 'sitewide') return !r.product_id;
    return r.product_id === filterProductId;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
          <p className="text-sm text-gray-500">
            Manage reviews displayed in the &ldquo;Straight from the gut&rdquo; section on product pages.
          </p>
        </div>
        {!editing && !isNew && (
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 self-start"
          >
            + Add Review
          </button>
        )}
      </div>

      {/* Edit / Create Form Modal/Card */}
      {(isNew || editing) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">
              {isNew ? 'Add New Review' : `Edit Review: ${editing?.reviewer_name}`}
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 text-sm font-semibold"
            >
              ✕ Cancel
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reviewer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Neha Verma"
                  value={form.reviewer_name}
                  onChange={(e) => setForm({ ...form, reviewer_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified Customer"
                  value={form.reviewer_location}
                  onChange={(e) => setForm({ ...form, reviewer_location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scope (Product Assignment)
                </label>
                <select
                  value={form.product_id}
                  onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="">All Products (Site-wide)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      Specific: {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Site-wide reviews display across every product detail page.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <select
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value={5}>★★★★★ (5 Stars)</option>
                    <option value={4}>★★★★☆ (4 Stars)</option>
                    <option value={3}>★★★☆☆ (3 Stars)</option>
                    <option value={2}>★★☆☆☆ (2 Stars)</option>
                    <option value={1}>★☆☆☆☆ (1 Star)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review Text <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Write or paste customer feedback..."
                value={form.review_text}
                onChange={(e) => setForm({ ...form, review_text: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                Active (visible on website)
              </label>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? 'Saving...' : isNew ? 'Create Review' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              {!isNew && editing && (
                <button
                  onClick={() => handleDelete(editing.id)}
                  className="ml-auto px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100"
                >
                  Delete Review
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3 mb-4 bg-white p-3 rounded-lg border">
        <span className="text-xs font-semibold text-gray-600">Filter Scope:</span>
        <select
          value={filterProductId}
          onChange={(e) => setFilterProductId(e.target.value)}
          className="text-xs px-2.5 py-1.5 border rounded-md bg-white text-gray-700"
        >
          <option value="all">All Reviews ({reviews.length})</option>
          <option value="sitewide">Site-wide Only ({reviews.filter((r) => !r.product_id).length})</option>
          {products.map((p) => {
            const count = reviews.filter((r) => r.product_id === p.id).length;
            return (
              <option key={p.id} value={p.id}>
                {p.name} ({count})
              </option>
            );
          })}
        </select>
        <span className="ml-auto text-xs text-gray-400">
          Showing {filteredReviews.length} of {reviews.length} reviews
        </span>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          <Star className="w-8 h-8 mx-auto text-amber-400 mb-2" />
          <p className="font-medium text-gray-700">No reviews found</p>
          <p className="text-xs text-gray-400 mt-1">
            {filterProductId !== 'all'
              ? 'No reviews match this filter.'
              : 'Click "+ Add Review" to add your first customer review.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b bg-gray-50 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3 w-12 text-center">Order</th>
                  <th className="px-4 py-3">Reviewer</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Review Text</th>
                  <th className="px-4 py-3">Scope</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3 text-center font-mono text-xs text-gray-400">
                      {rev.display_order}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 text-xs">{rev.reviewer_name}</div>
                      {rev.reviewer_location && (
                        <div className="text-[11px] text-gray-500">{rev.reviewer_location}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-amber-500 text-xs tracking-wider">
                        {'★'.repeat(rev.rating)}
                        {'☆'.repeat(5 - rev.rating)}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs md:max-w-md">
                      <p className="text-xs text-gray-600 line-clamp-2 italic">
                        &ldquo;{rev.review_text}&rdquo;
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {rev.product_id ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          <Sprout className="w-3 h-3 text-blue-700 inline" />
                          <span>{rev.product_name || 'Product'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Globe className="w-3 h-3 text-emerald-700 inline" />
                          <span>Site-wide</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(rev)}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                          rev.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title="Click to toggle status"
                      >
                        {rev.is_active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(rev)}
                        className="text-xs text-gray-700 hover:text-black font-medium mr-3 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rev.id)}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
