'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
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
  Trash2,
  Clock,
} from '@/components/icons';

interface Inquiry {
  id: string;
  business_name?: string;
  restaurant_name?: string;
  contact_name?: string;
  contact_person?: string;
  phone: string;
  email: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-amber-50 text-amber-700 border-amber-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
};

const statusLabels: Record<string, string> = {
  new: 'New Inquiry',
  contacted: 'Contacted',
  closed: 'Closed',
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/inquiries');
      if (res.ok) {
        const data = await res.json();
        setInquiries(Array.isArray(data) ? data : []);
      }
    } catch {
      showFeedback('Failed to load inquiries. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setActionMessage(msg);
    setFeedbackType(type);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const previous = inquiries.find((i) => i.id === id)?.status;
    // Optimistic UI update
    setInquiries((prev) =>
      prev.map((inq) => (inq.id === id ? { ...inq, status: newStatus } : inq))
    );
    setUpdatingId(id);

    try {
      const res = await adminFetch(`/api/admin/inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showFeedback(`Inquiry status updated to ${statusLabels[newStatus] || newStatus}`);
      } else {
        // Rollback
        if (previous) {
          setInquiries((prev) =>
            prev.map((inq) => (inq.id === id ? { ...inq, status: previous } : inq))
          );
        }
        const data = await res.json().catch(() => null);
        showFeedback(data?.error || 'Failed to update status', 'error');
      }
    } catch {
      if (previous) {
        setInquiries((prev) =>
          prev.map((inq) => (inq.id === id ? { ...inq, status: previous } : inq))
        );
      }
      showFeedback('Network error while updating status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteInquiry = async (id: string, contact: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete inquiry from "${contact}"?`)) {
      return;
    }

    try {
      let res = await adminFetch(`/api/admin/inquiries/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        res = await adminFetch(`/api/admin/inquiries/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete' }),
        });
      }

      if (res.ok) {
        setInquiries((prev) => prev.filter((i) => i.id !== id));
        showFeedback('Inquiry deleted successfully');
      } else {
        const data = await res.json().catch(() => null);
        showFeedback(data?.error || 'Failed to delete inquiry', 'error');
      }
    } catch {
      showFeedback('Network error while deleting inquiry', 'error');
    }
  };

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      if (statusFilter && inq.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const bName = (inq.business_name || inq.restaurant_name || '').toLowerCase();
        const cName = (inq.contact_name || inq.contact_person || '').toLowerCase();
        const phone = inq.phone?.toLowerCase() || '';
        const email = inq.email?.toLowerCase() || '';
        const msg = inq.message?.toLowerCase() || '';
        return (
          bName.includes(q) ||
          cName.includes(q) ||
          phone.includes(q) ||
          email.includes(q) ||
          msg.includes(q)
        );
      }
      return true;
    });
  }, [inquiries, statusFilter, searchQuery]);

  // Metric counts
  const totalCount = inquiries.length;
  const newCount = inquiries.filter((i) => i.status === 'new').length;
  const contactedCount = inquiries.filter((i) => i.status === 'contacted').length;
  const closedCount = inquiries.filter((i) => i.status === 'closed').length;

  const exportCSV = () => {
    const headers = [
      '#',
      'Business / Subject',
      'Contact Person',
      'Phone',
      'Email',
      'Status',
      'Message',
      'Created At',
    ];

    const rows = filteredInquiries.map((inq, idx) => [
      idx + 1,
      inq.business_name || inq.restaurant_name || 'N/A',
      inq.contact_name || inq.contact_person || 'N/A',
      inq.phone,
      inq.email || '',
      inq.status,
      inq.message || '',
      new Date(inq.created_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    ]);

    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCSV(`wga-customer-inquiries-${dateStr}.csv`, [headers, ...rows]);
    showFeedback('Inquiries exported to CSV successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Customer &amp; Culinary Inquiries
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            General questions, order support, and culinary partnership inquiries submitted through the contact page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCSV}
            disabled={filteredInquiries.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4 text-gray-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-3 border rounded-lg text-sm flex items-center justify-between animate-fadeIn shadow-sm ${
            feedbackType === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span className="font-medium">{actionMessage}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="font-bold ml-4 hover:opacity-75"
          >
            &times;
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === ''
              ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-xs uppercase font-semibold text-gray-500 tracking-wider">
            All Inquiries
          </span>
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
          <span className="text-xs uppercase font-semibold text-blue-600 tracking-wider">
            New
          </span>
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
          <span className="text-xs uppercase font-semibold text-amber-600 tracking-wider">
            Contacted
          </span>
          <p className="text-2xl font-bold text-amber-700 mt-1">{contactedCount}</p>
        </div>
        <div
          onClick={() => setStatusFilter('closed')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === 'closed'
              ? 'bg-gray-100 border-gray-300 shadow-sm'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className="text-xs uppercase font-semibold text-gray-600 tracking-wider">
            Closed
          </span>
          <p className="text-2xl font-bold text-gray-700 mt-1">{closedCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name, business, phone, email, or message..."
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
            <option value="closed">Closed</option>
          </select>
          {(statusFilter || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setSearchQuery('');
              }}
              className="text-xs text-gray-500 hover:text-gray-800 underline px-2 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 text-center text-gray-500 bg-white rounded-xl border">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent mb-3" />
          <p className="text-sm">Loading inquiries...</p>
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="py-16 text-center text-gray-500 bg-white rounded-xl border">
          <Clipboard className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="font-medium text-gray-800">No inquiries found</p>
          <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            {statusFilter || searchQuery
              ? 'Try adjusting your search query or status filter.'
              : 'Inquiries submitted through the /contact-us page will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((inq) => {
            const businessName = inq.business_name || inq.restaurant_name || 'Customer Inquiry';
            const contactName = inq.contact_name || inq.contact_person || 'Customer';
            const cleanPhone = inq.phone ? inq.phone.replace(/[^\d]/g, '') : '';
            const whatsappUrl = cleanPhone
              ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=${encodeURIComponent(
                  `Hello ${contactName}, thank you for reaching out to Wild About Greens! We are getting back to you regarding your inquiry.`
                )}`
              : null;

            return (
              <div
                key={inq.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gray-50/75 px-5 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{businessName}</span>
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        {new Date(inq.created_at).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        statusColors[inq.status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {statusLabels[inq.status] || inq.status}
                    </span>
                    <select
                      value={inq.status}
                      disabled={updatingId === inq.id}
                      onChange={(e) => updateStatus(inq.id, e.target.value)}
                      className="text-xs bg-white border border-gray-300 rounded-md px-2.5 py-1 font-medium focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="new">Mark: New</option>
                      <option value="contacted">Mark: Contacted</option>
                      <option value="closed">Mark: Closed</option>
                    </select>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Column 1: Contact Details */}
                  <div className="space-y-2 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
                      <User className="w-4 h-4 text-gray-500 shrink-0" />
                      <span>{contactName}</span>
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1.5 pt-1">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <a
                          href={`tel:${inq.phone}`}
                          className="text-emerald-700 hover:underline font-mono"
                        >
                          {inq.phone}
                        </a>
                      </div>
                      {inq.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <a
                            href={`mailto:${inq.email}`}
                            className="text-gray-700 hover:underline truncate"
                          >
                            {inq.email}
                          </a>
                        </div>
                      )}
                    </div>
                    {/* Action buttons */}
                    <div className="pt-2 flex flex-wrap gap-2">
                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
                        >
                          <WhatsApp className="w-3.5 h-3.5 shrink-0" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                      <a
                        href={`tel:${inq.phone}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>

                  {/* Column 2: Message Content */}
                  <div className="md:col-span-2 space-y-3 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                        Inquiry Message
                      </span>
                      <div className="text-sm text-gray-800 bg-gray-50/80 p-3.5 rounded-xl border border-gray-100 whitespace-pre-wrap leading-relaxed">
                        {inq.message || (
                          <span className="text-gray-400 italic">No detailed message entered.</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        {updatingId === inq.id ? (
                          <span className="text-xs text-amber-600 font-medium">Updating status...</span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Status:{' '}
                            <strong className="text-gray-700 font-semibold">
                              {statusLabels[inq.status] || inq.status}
                            </strong>
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteInquiry(inq.id, contactName)}
                        className="text-xs text-rose-500 hover:text-rose-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Inquiry</span>
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
