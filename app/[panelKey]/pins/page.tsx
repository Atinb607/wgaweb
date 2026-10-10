'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminAuth';
import ImageField from '@/components/admin/ImageField';

interface Pin {
  id: string;
  group_key: string;
  icon: string | null;
  title: string;
  description: string | null;
  image_url?: string | null;
  link_url?: string | null;
  display_order: number;
  is_active: boolean;
}

const emptyPin = {
  group_key: '',
  icon: '',
  title: '',
  description: '',
  image_url: '',
  link_url: '',
  display_order: 0,
  is_active: true,
};

const EXCLUDED_GROUPS = ['homepage_shop_by_goal', 'shop_by_health_goal', 'shop_by_goal'];

function isExcludedGroup(key: string): boolean {
  if (!key) return false;
  const normalized = key.toLowerCase();
  return (
    EXCLUDED_GROUPS.includes(normalized) ||
    normalized.includes('shop_by_goal') ||
    normalized.includes('shop_by_health_goal')
  );
}

export default function AdminPinsPage() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [activeGroup, setActiveGroup] = useState('');
  const [editing, setEditing] = useState<Pin | null>(null);
  const [form, setForm] = useState(emptyPin);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadAllPins = useCallback(async () => {
    const res = await adminFetch('/api/admin/pins');
    if (res.ok) {
      const data: Pin[] = await res.json();
      const visiblePins = data.filter((p) => !isExcludedGroup(p.group_key));
      setPins(visiblePins);
      const uniqueGroups = Array.from(new Set(visiblePins.map((p) => p.group_key))).sort();
      setGroups(uniqueGroups);
      if ((!activeGroup || isExcludedGroup(activeGroup)) && uniqueGroups.length > 0) {
        setActiveGroup(uniqueGroups[0]);
      }
    }
  }, [activeGroup]);

  useEffect(() => {
    loadAllPins();
  }, [loadAllPins]);

  const filteredPins = pins
    .filter((p) => p.group_key === activeGroup)
    .sort((a, b) => a.display_order - b.display_order);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew) {
        const payload = {
          ...form,
          group_key: form.group_key || activeGroup,
        };
        const res = await adminFetch('/api/admin/pins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setIsNew(false);
          setForm(emptyPin);
          loadAllPins();
        }
      } else if (editing) {
        const res = await adminFetch(`/api/admin/pins/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          setEditing(null);
          setForm(emptyPin);
          loadAllPins();
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pin?')) return;
    await adminFetch(`/api/admin/pins/${id}`, { method: 'DELETE' });
    loadAllPins();
  };

  // Editing / Creating view
  if (editing || isNew) {
    return (
      <div>
        <button
          onClick={() => {
            setEditing(null);
            setIsNew(false);
            setForm(emptyPin);
          }}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          &larr; Back to list
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isNew ? 'Add Pin' : `Edit Pin: ${editing?.title}`}
        </h1>

        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Key</label>
              <input
                value={form.group_key || activeGroup}
                onChange={(e) => setForm({ ...form, group_key: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                disabled={!!editing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Badge / Icon (e.g. 01 Purity)
              </label>
              <input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="e.g. 01 Purity"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Image (optional)</label>
              {form.image_url && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, image_url: '' }))}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Remove photo
                </button>
              )}
            </div>
            <ImageField
              value={form.image_url || null}
              onChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
              aspectRatio="4/3"
              folder={`pins/${form.group_key || activeGroup || 'general'}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link URL (optional)
            </label>
            <input
              value={form.link_url || ''}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              placeholder="e.g. /products?category=immunity"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm pb-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Active
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.title}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Pin'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Content Pins</h1>

      {/* Group tabs */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeGroup === g
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {g.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {!activeGroup ? (
        <p className="text-gray-400 text-sm">No pin groups available.</p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider">
              {activeGroup.replace(/_/g, ' ')}
            </h2>
            <button
              onClick={() => {
                setIsNew(true);
                setForm({ ...emptyPin, group_key: activeGroup });
              }}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
            >
              + Add Pin
            </button>
          </div>

          <div className="space-y-3">
            {filteredPins.map((pin) => (
              <div
                key={pin.id}
                className="bg-white rounded-xl border p-5 flex items-start justify-between"
              >
                <div className="flex items-start gap-3">
                  {pin.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pin.image_url}
                      alt={pin.title}
                      className="w-12 h-12 rounded-lg object-cover border shrink-0"
                    />
                  ) : (
                    pin.icon && (
                      <span
                        className={
                          pin.icon.length <= 4
                            ? 'text-2xl shrink-0'
                            : 'font-mono text-[11px] font-bold uppercase tracking-wider text-[#1C3F2D] bg-[#DCF5A8]/70 px-2.5 py-1 rounded-full shrink-0 self-start'
                        }
                      >
                        {pin.icon}
                      </span>
                    )
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900">{pin.title}</h3>
                    {pin.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{pin.description}</p>
                    )}
                    {pin.link_url && (
                      <p className="text-xs text-blue-600 mt-0.5 font-mono">{pin.link_url}</p>
                    )}
                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                      <span>Order: {pin.display_order}</span>
                      <span
                        className={
                          pin.is_active ? 'text-green-600' : 'text-red-500'
                        }
                      >
                        {pin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditing(pin);
                      setForm({
                        group_key: pin.group_key,
                        icon: pin.icon || '',
                        title: pin.title,
                        description: pin.description || '',
                        image_url: pin.image_url || '',
                        link_url: pin.link_url || '',
                        display_order: pin.display_order,
                        is_active: pin.is_active,
                      });
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pin.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {filteredPins.length === 0 && (
              <p className="text-center text-gray-400 py-8">
                No pins in this group yet. Add one above.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
