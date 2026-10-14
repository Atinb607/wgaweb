'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { adminFetch } from '@/lib/adminAuth';
import { AlertTriangle, Clipboard, Search, Truck } from '@/components/icons';

export interface DeliveryPincode {
  id: string;
  pincode: string;
  area_name: string | null;
  city: string | null;
  notes: string | null;
  is_active: boolean;
  is_free_delivery?: boolean;
  created_at?: string;
  updated_at?: string;
}

const emptyForm = {
  pincode: '',
  area_name: '',
  city: 'Mohali / Chandigarh',
  notes: '',
  is_active: true,
  is_free_delivery: false,
};

export default function AdminDeliveryPincodesPage() {
  const [pincodes, setPincodes] = useState<DeliveryPincode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DeliveryPincode | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Bulk add state
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkArea, setBulkArea] = useState('');
  const [bulkCity, setBulkCity] = useState('Mohali / Chandigarh');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ added: number; skipped: number; errors: string[] } | null>(null);

  // Action feedback message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const loadPincodes = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/delivery-pincodes');
      if (res.ok) {
        const data = await res.json();
        setPincodes(data.pincodes || []);
      } else {
        const err = await res.json().catch(() => ({}));
        showFeedback('error', err.error || 'Failed to load delivery pincodes.');
      }
    } catch {
      showFeedback('error', 'Network error while loading delivery pincodes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPincodes();
  }, [loadPincodes]);

  // Filtered pincodes list
  const filteredPincodes = useMemo(() => {
    return pincodes.filter((p) => {
      // Filter by status
      if (statusFilter === 'active' && !p.is_active) return false;
      if (statusFilter === 'inactive' && p.is_active) return false;

      // Filter by search query
      if (!search.trim()) return true;
      const query = search.trim().toLowerCase();
      const pin = p.pincode.toLowerCase();
      const area = (p.area_name || '').toLowerCase();
      const city = (p.city || '').toLowerCase();
      const notes = (p.notes || '').toLowerCase();
      return pin.includes(query) || area.includes(query) || city.includes(query) || notes.includes(query);
    });
  }, [pincodes, search, statusFilter]);

  // Open modal for new pincode
  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (item: DeliveryPincode) => {
    setEditingItem(item);
    setForm({
      pincode: item.pincode,
      area_name: item.area_name || '',
      city: item.city || 'Mohali / Chandigarh',
      notes: item.notes || '',
      is_active: item.is_active,
      is_free_delivery: Boolean(item.is_free_delivery),
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save single pincode (Add or Edit)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanPin = form.pincode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setFormError('Please enter a valid 6-digit postal code.');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        // Update existing
        const res = await adminFetch(`/api/admin/delivery-pincodes/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pincode: cleanPin,
            area_name: form.area_name.trim() || null,
            city: form.city.trim() || null,
            notes: form.notes.trim() || null,
            is_active: form.is_active,
            is_free_delivery: Boolean(form.is_free_delivery),
          }),
        });

        const data = await res.json();
        if (res.ok) {
          showFeedback('success', `Pincode ${cleanPin} updated successfully.`);
          setIsModalOpen(false);
          loadPincodes();
        } else {
          setFormError(data.error || 'Failed to update pincode.');
        }
      } else {
        // Create new
        const res = await adminFetch('/api/admin/delivery-pincodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pincode: cleanPin,
            area_name: form.area_name.trim() || null,
            city: form.city.trim() || null,
            notes: form.notes.trim() || null,
            is_active: form.is_active,
            is_free_delivery: Boolean(form.is_free_delivery),
          }),
        });

        const data = await res.json();
        if (res.ok) {
          showFeedback('success', `Pincode ${cleanPin} added to deliverable list.`);
          setIsModalOpen(false);
          loadPincodes();
        } else {
          setFormError(data.error || 'Failed to add pincode.');
        }
      }
    } catch {
      setFormError('Network error while saving. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle active status inline
  const handleToggleActive = async (item: DeliveryPincode) => {
    const updatedStatus = !item.is_active;

    // Optimistic update
    setPincodes((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, is_active: updatedStatus } : p))
    );

    try {
      const res = await adminFetch(`/api/admin/delivery-pincodes/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: updatedStatus }),
      });

      if (!res.ok) {
        // Rollback
        loadPincodes();
        showFeedback('error', 'Failed to update status.');
      } else {
        showFeedback(
          'success',
          `Pincode ${item.pincode} ${updatedStatus ? 'activated' : 'deactivated'}.`
        );
      }
    } catch {
      loadPincodes();
      showFeedback('error', 'Network error updating status.');
    }
  };

  // Delete pincode
  const handleDelete = async (item: DeliveryPincode) => {
    if (
      !confirm(
        `Are you sure you want to remove pincode ${item.pincode} from free delivery eligibility?\nOrders to this pincode will follow standard delivery rules (₹69 fee under ₹500).`
      )
    ) {
      return;
    }

    try {
      const res = await adminFetch(`/api/admin/delivery-pincodes/${item.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showFeedback('success', `Pincode ${item.pincode} removed successfully.`);
        setPincodes((prev) => prev.filter((p) => p.id !== item.id));
      } else {
        const data = await res.json().catch(() => ({}));
        showFeedback('error', data.error || 'Failed to delete pincode.');
      }
    } catch {
      showFeedback('error', 'Network error deleting pincode.');
    }
  };

  // Bulk add pincodes
  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawTokens = bulkInput
      .split(/[\s,;\n]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const validPins = Array.from(new Set(rawTokens.filter((t) => /^\d{6}$/.test(t))));
    const invalidPins = rawTokens.filter((t) => !/^\d{6}$/.test(t));

    if (validPins.length === 0) {
      alert('Please enter at least one valid 6-digit postal code.');
      return;
    }

    setBulkSaving(true);
    let addedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    if (invalidPins.length > 0) {
      errors.push(`Skipped ${invalidPins.length} invalid entries (not 6 digits): ${invalidPins.slice(0, 5).join(', ')}${invalidPins.length > 5 ? '...' : ''}`);
    }

    for (const pin of validPins) {
      try {
        const res = await adminFetch('/api/admin/delivery-pincodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pincode: pin,
            area_name: bulkArea.trim() || null,
            city: bulkCity.trim() || null,
            notes: 'Bulk imported via admin',
            is_active: true,
          }),
        });

        if (res.ok) {
          addedCount++;
        } else {
          skippedCount++;
        }
      } catch {
        skippedCount++;
      }
    }

    setBulkSaving(false);
    setBulkResult({ added: addedCount, skipped: skippedCount, errors });
    loadPincodes();

    if (addedCount > 0) {
      showFeedback('success', `Bulk add complete: ${addedCount} pincode(s) added.`);
    }
  };

  const activeCount = pincodes.filter((p) => p.is_active).length;
  const freeFarmCount = pincodes.filter((p) => p.is_active && p.is_free_delivery).length;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          <span>{feedback.type === 'success' ? '✓' : <AlertTriangle className="w-4 h-4 text-red-600 inline" />}</span>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Delivery Available Areas</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Live Gate Active
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1 max-w-3xl leading-relaxed">
            Only customers delivering to an active pincode in this list can checkout via <strong>Pay Securely</strong> or <strong>COD</strong>.
            Standard delivery rules apply (<strong>₹69 fee under ₹500</strong>, and <strong>FREE delivery on ₹500+ orders</strong>).
            For any other pincode outside this list, payment options are hidden and a <strong>WhatsApp Delivery Request</strong> button is shown.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsBulkOpen(true);
              setBulkInput('');
              setBulkResult(null);
            }}
            className="px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <Clipboard className="w-4 h-4 text-gray-600" />
            <span>Bulk Add</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-medium transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Add Area</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4 shadow-2xs">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Areas</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{pincodes.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Configured postal codes</p>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-2xs">
          <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Deliverable Areas</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{activeCount}</p>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">Active for checkout</p>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-2xs">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Standard Fee</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹69</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Orders under ₹500</p>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-2xs">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Free Threshold</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹500</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Free for all available areas</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border rounded-xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-sm">
            <Search className="w-4 h-4 text-gray-400" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pincode, locality, city, notes..."
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(['all', 'active', 'inactive'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === filter
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="py-16 text-center text-gray-500 text-sm">
            <span className="animate-pulse">Loading free delivery pincodes...</span>
          </div>
        ) : filteredPincodes.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <Truck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <h3 className="text-base font-semibold text-gray-900">
              {pincodes.length === 0
                ? 'No free delivery pincodes added yet'
                : 'No matching pincodes found'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {pincodes.length === 0
                ? 'Add your first pincode above to give local customers complimentary ₹0 farm delivery.'
                : 'Try clearing your search or filter to view all pincodes.'}
            </p>
            {pincodes.length === 0 && (
              <button
                onClick={handleOpenAdd}
                className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold"
              >
                + Add Pincode
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b text-gray-500 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Pincode</th>
                  <th className="py-3 px-4">Locality / Area</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Delivery Rate</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPincodes.map((pin) => (
                  <tr key={pin.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-sm bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200">
                        {pin.pincode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900">
                      {pin.area_name || <span className="text-gray-400 text-xs italic">—</span>}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {pin.city || <span className="text-gray-400 text-xs italic">—</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      {pin.is_free_delivery ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Always Free (Farm Zone)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
                          ₹69 · Free on ₹500+
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(pin)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          pin.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title="Click to toggle active deliverable status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            pin.is_active ? 'bg-emerald-600' : 'bg-gray-400'
                          }`}
                        />
                        {pin.is_active ? 'Deliverable' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(pin)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(pin)}
                        className="text-xs font-medium text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Pincode Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-2xl border shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between bg-gray-50">
              <h2 className="font-bold text-gray-900 text-lg">
                {editingItem ? `Edit Pincode: ${editingItem.pincode}` : 'Add Free Delivery Pincode'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setForm({ ...form, pincode: digits });
                  }}
                  placeholder="e.g. 140306"
                  required
                  className="w-full px-3.5 py-2.5 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Must be exactly 6 numeric digits.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Locality / Area Name
                </label>
                <input
                  type="text"
                  value={form.area_name}
                  onChange={(e) => setForm({ ...form, area_name: e.target.value })}
                  placeholder="e.g. Mohali Sectors 81, 82, 83, Manauli"
                  className="w-full px-3.5 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  City / Region
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Mohali, Chandigarh, Panchkula"
                  className="w-full px-3.5 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Internal Notes (Optional)
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Immediate local farm zone"
                  className="w-full px-3.5 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 space-y-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-800">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span>Active Deliverable Area</span>
                  </label>
                  <p className="text-[11px] text-gray-500 ml-6 mt-0.5 leading-relaxed">
                    When active, customers at this pincode can checkout normally. If inactive, online payment &amp; COD are hidden and WhatsApp request is shown.
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-emerald-950">
                    <input
                      type="checkbox"
                      checked={Boolean(form.is_free_delivery)}
                      onChange={(e) => setForm({ ...form, is_free_delivery: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span>Always Free Farm Delivery (₹0 on all orders)</span>
                  </label>
                  <p className="text-[11px] text-emerald-800/80 ml-6 mt-0.5 leading-relaxed">
                    Enable this only for immediate local farm zones. If unchecked, standard rules apply (₹69 fee under ₹500, Free on orders ₹500+).
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Pincode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-2xl border shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between bg-gray-50">
              <h2 className="font-bold text-gray-900 text-lg">Bulk Add Free Delivery Pincodes</h2>
              <button
                type="button"
                onClick={() => setIsBulkOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBulkAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Pincodes List (Comma, Space or Newline separated)
                </label>
                <textarea
                  rows={4}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="e.g. 140306, 160062, 160071&#10;160059 160055"
                  className="w-full px-3.5 py-2.5 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Duplicates and non-6-digit tokens will be handled gracefully.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Locality / Area Name
                  </label>
                  <input
                    type="text"
                    value={bulkArea}
                    onChange={(e) => setBulkArea(e.target.value)}
                    placeholder="e.g. Tricity Zone"
                    className="w-full px-3.5 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    City / Region
                  </label>
                  <input
                    type="text"
                    value={bulkCity}
                    onChange={(e) => setBulkCity(e.target.value)}
                    placeholder="e.g. Mohali / Chandigarh"
                    className="w-full px-3.5 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              {bulkResult && (
                <div className="p-3 bg-gray-50 border rounded-lg text-xs space-y-1">
                  <p className="font-semibold text-gray-900">
                    Results: {bulkResult.added} added, {bulkResult.skipped} skipped.
                  </p>
                  {bulkResult.errors.map((err, idx) => (
                    <p key={idx} className="text-amber-700">
                      {err}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsBulkOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={bulkSaving}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {bulkSaving ? 'Importing...' : 'Import Pincodes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
