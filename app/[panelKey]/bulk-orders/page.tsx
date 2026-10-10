'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/adminAuth';
import { downloadCSV } from '@/lib/csvExport';
import {
  Download,
  Search,
  Clipboard,
  User,
  Building,
  Phone,
  Mail,
  WhatsApp,
  PackageBox,
  MapPin,
  Trash2,
} from '@/components/icons';

interface BulkOrderRequest {
  id: string;
  ticket_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  trays_count: number;
  products: string;
  business_name: string | null;
  delivery_address: string | null;
  delivery_pincode: string | null;
  frequency: string | null;
  notes: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  contacted: 'bg-amber-100 text-amber-800 border-amber-200',
  in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
  fulfilled: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
};

const statusLabels: Record<string, string> = {
  new: 'New Request',
  contacted: 'Contacted',
  in_progress: 'In Progress',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};

export default function AdminBulkOrdersPage() {
  const [requests, setRequests] = useState<BulkOrderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      const res = await adminFetch(`/api/admin/bulk-orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Failed to load bulk order requests:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await adminFetch(`/api/admin/bulk-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
        showFeedback('Status updated successfully');
      }
    } catch {
      showFeedback('Failed to update status');
    }
  };

  const saveAdminNotes = async (id: string) => {
    setSavingNotes(true);
    try {
      const res = await adminFetch(`/api/admin/bulk-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: notesDraft }),
      });
      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, admin_notes: notesDraft } : r))
        );
        setEditingNotesId(null);
        showFeedback('Notes saved successfully');
      }
    } catch {
      showFeedback('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const deleteRequest = async (id: string, ticketNumber: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete request ${ticketNumber}?`)) {
      return;
    }
    try {
      const res = await adminFetch(`/api/admin/bulk-orders/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        showFeedback(`Request ${ticketNumber} deleted`);
      }
    } catch {
      showFeedback('Failed to delete request');
    }
  };

  const showFeedback = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3000);
  };

  const exportCSV = () => {
    const headers = [
      'Ticket Number',
      'Date Submitted',
      'Customer Name',
      'Business / Restaurant',
      'Phone',
      'Email',
      'Trays Requested',
      'Products Requested',
      'Frequency',
      'Delivery Address',
      'Pincode',
      'Customer Notes',
      'Status',
      'Admin Internal Notes',
    ];

    const rows = requests.map((r) => [
      r.ticket_number,
      new Date(r.created_at).toLocaleString(),
      r.customer_name,
      r.business_name || '',
      r.customer_phone,
      r.customer_email,
      r.trays_count,
      r.products,
      r.frequency || '',
      r.delivery_address || '',
      r.delivery_pincode || '',
      r.notes || '',
      r.status,
      r.admin_notes || '',
    ]);

    downloadCSV(
      `bulk-orders-${new Date().toISOString().slice(0, 10)}.csv`,
      [headers, ...rows]
    );
  };

  // Metrics
  const totalCount = requests.length;
  const newCount = requests.filter((r) => r.status === 'new').length;
  const contactedCount = requests.filter((r) => r.status === 'contacted').length;
  const inProgressCount = requests.filter((r) => r.status === 'in_progress').length;
  const fulfilledCount = requests.filter((r) => r.status === 'fulfilled').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Bulk Orders Request
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Commercial and large custom orders from restaurants, chefs, catering partners, and retail clients.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={requests.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-gray-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center justify-between animate-fadeIn">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-600 hover:text-emerald-900 font-bold ml-4">
            &times;
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setStatusFilter('')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === ''
              ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-xs uppercase font-semibold text-gray-500 tracking-wider">All Requests</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</p>
        </div>
        <div
          onClick={() => setStatusFilter('new')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === 'new'
              ? 'bg-blue-50 border-blue-300 shadow-sm'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-xs uppercase font-semibold text-blue-600 tracking-wider">New</span>
          <p className="text-2xl font-bold text-blue-700 mt-1">{newCount}</p>
        </div>
        <div
          onClick={() => setStatusFilter('contacted')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === 'contacted'
              ? 'bg-amber-50 border-amber-300 shadow-sm'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-xs uppercase font-semibold text-amber-600 tracking-wider">Contacted</span>
          <p className="text-2xl font-bold text-amber-700 mt-1">{contactedCount}</p>
        </div>
        <div
          onClick={() => setStatusFilter('in_progress')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === 'in_progress'
              ? 'bg-purple-50 border-purple-300 shadow-sm'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-xs uppercase font-semibold text-purple-600 tracking-wider">In Progress</span>
          <p className="text-2xl font-bold text-purple-700 mt-1">{inProgressCount}</p>
        </div>
        <div
          onClick={() => setStatusFilter('fulfilled')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === 'fulfilled'
              ? 'bg-emerald-50 border-emerald-300 shadow-sm'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-xs uppercase font-semibold text-emerald-600 tracking-wider">Fulfilled</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{fulfilledCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name, phone, email, ticket, business, or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">
            <Search className="w-4 h-4 text-gray-400" />
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="in_progress">In Progress</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {(statusFilter || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setSearchQuery('');
              }}
              className="text-xs text-gray-500 hover:text-gray-800 underline px-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="py-16 text-center text-gray-500 bg-white rounded-xl border">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent mb-3" />
          <p className="text-sm">Loading bulk order requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="py-16 text-center text-gray-500 bg-white rounded-xl border">
          <Clipboard className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="font-medium text-gray-800">No bulk order requests found</p>
          <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            {statusFilter || searchQuery
              ? 'Try adjusting your search query or status filter.'
              : 'Incoming requests submitted through the /bulk-order page will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const cleanPhone = req.customer_phone.replace(/[^\d]/g, '');
            const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=${encodeURIComponent(
              `Hello ${req.customer_name}, thank you for your bulk order inquiry (${req.ticket_number}) for ${req.trays_count} trays of microgreens at Wild About Greens! We'd love to discuss your requirements.`
            )}`;

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Request Header Bar */}
                <div className="bg-gray-50/75 px-5 py-3.5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold bg-gray-200 text-gray-800 px-2.5 py-1 rounded-md">
                      {req.ticket_number}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(req.created_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        statusColors[req.status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {statusLabels[req.status] || req.status}
                    </span>
                    <select
                      value={req.status}
                      onChange={(e) => updateStatus(req.id, e.target.value)}
                      className="text-xs bg-white border border-gray-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-emerald-500 font-medium"
                    >
                      <option value="new">Mark: New</option>
                      <option value="contacted">Mark: Contacted</option>
                      <option value="in_progress">Mark: In Progress</option>
                      <option value="fulfilled">Mark: Fulfilled</option>
                      <option value="cancelled">Mark: Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Main Body */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Column 1: Customer Contact Info */}
                  <div className="space-y-2 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
                      <User className="w-4 h-4 text-gray-500 shrink-0" />
                      <span>{req.customer_name}</span>
                    </h3>
                    {req.business_name && (
                      <p className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{req.business_name}</span>
                      </p>
                    )}
                    <div className="text-sm text-gray-600 space-y-1 pt-1">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <a href={`tel:${req.customer_phone}`} className="text-emerald-700 hover:underline font-mono">
                          {req.customer_phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <a href={`mailto:${req.customer_email}`} className="text-gray-700 hover:underline truncate">
                          {req.customer_email}
                        </a>
                      </div>
                    </div>
                    {/* Instant Action Pills */}
                    <div className="pt-2 flex flex-wrap gap-2">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
                      >
                        <WhatsApp className="w-3.5 h-3.5 shrink-0" />
                        <span>WhatsApp</span>
                      </a>
                      <a
                        href={`tel:${req.customer_phone}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>

                  {/* Column 2: Order Specifications */}
                  <div className="space-y-3 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-sm">
                        <PackageBox className="w-4 h-4 shrink-0 text-emerald-800" />
                        <span>{req.trays_count} Trays Requested</span>
                      </span>
                      {req.frequency && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded capitalize">
                          {req.frequency}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                        Requested Products &amp; Varieties
                      </span>
                      <p className="text-sm text-gray-900 font-medium bg-gray-50 p-2.5 rounded-lg border border-gray-100 leading-relaxed">
                        {req.products}
                      </p>
                    </div>

                    {(req.delivery_address || req.delivery_pincode) && (
                      <div className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-600 inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>Delivery to:</span>
                        </span>{' '}
                        {req.delivery_address} {req.delivery_pincode ? `(${req.delivery_pincode})` : ''}
                      </div>
                    )}
                  </div>

                  {/* Column 3: Customer Notes & Admin Internal Remarks */}
                  <div className="space-y-3 flex flex-col justify-between">
                    <div>
                      {req.notes && (
                        <div className="mb-3">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                            Customer Special Instructions
                          </span>
                          <p className="text-xs text-gray-700 bg-amber-50/60 border border-amber-100 p-2 rounded-lg italic">
                            &ldquo;{req.notes}&rdquo;
                          </p>
                        </div>
                      )}

                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                          Internal Notes
                        </span>
                        {editingNotesId === req.id ? (
                          <div className="space-y-2">
                            <textarea
                              rows={2}
                              value={notesDraft}
                              onChange={(e) => setNotesDraft(e.target.value)}
                              placeholder="Add follow-up details, quotes given, harvest timeline..."
                              className="w-full text-xs p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-emerald-500"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveAdminNotes(req.id)}
                                disabled={savingNotes}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {savingNotes ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={() => setEditingNotesId(null)}
                                className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-md border border-gray-100 flex items-start justify-between gap-2">
                            <span className="italic">
                              {req.admin_notes || 'No notes added yet.'}
                            </span>
                            <button
                              onClick={() => {
                                setEditingNotesId(req.id);
                                setNotesDraft(req.admin_notes || '');
                              }}
                              className="text-emerald-700 hover:text-emerald-900 font-semibold underline shrink-0"
                            >
                              {req.admin_notes ? 'Edit' : '+ Add'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 text-right">
                      <button
                        onClick={() => deleteRequest(req.id, req.ticket_number)}
                        className="text-xs text-rose-500 hover:text-rose-700 hover:underline inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Request</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
