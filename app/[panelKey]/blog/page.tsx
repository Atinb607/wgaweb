'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminAuth';
import ImageField from '@/components/admin/ImageField';
import { Utensils, Pin } from '@/components/icons';

interface Post {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  cover_image_alt_text?: string | null;
  post_type: 'article' | 'recipe';
  is_published: boolean;
  show_on_homepage: boolean;
  published_at: string | null;
  created_at: string;
  recipe_ingredients?: string[] | null;
  recipe_method_steps?: string[] | null;
  recipe_prep_time?: string | null;
  recipe_cook_time?: string | null;
  recipe_difficulty?: string | null;
  recipe_serves?: string | null;
  recipe_categories?: string[] | null;
}

const emptyPost = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  cover_image_url: '',
  cover_image_alt_text: '',
  post_type: 'article' as 'article' | 'recipe',
  is_published: false,
  show_on_homepage: false,
  recipe_ingredients: [] as string[],
  recipe_method_steps: [] as string[],
  recipe_prep_time: '',
  recipe_cook_time: '',
  recipe_difficulty: '',
  recipe_serves: '',
  recipe_categories: [] as string[],
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState(emptyPost);
  const [newCatInput, setNewCatInput] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'article' | 'recipe'>('all');

  // Pinned recipes on Homepage
  const [allRecipes, setAllRecipes] = useState<{ id: string; slug: string; title: string; is_published: boolean }[]>([]);
  const [pinned1, setPinned1] = useState('');
  const [pinned2, setPinned2] = useState('');
  const [savingPinned, setSavingPinned] = useState(false);
  const [pinnedSavedMessage, setPinnedSavedMessage] = useState(false);

  const loadPosts = useCallback(async () => {
    const url = filterType === 'all' ? '/api/admin/blog' : `/api/admin/blog?type=${filterType}`;
    const res = await adminFetch(url);
    if (res.ok) setPosts(await res.json());
  }, [filterType]);

  const loadPinnedRecipes = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/blog/pinned-recipes');
      if (res.ok) {
        const data = await res.json();
        setAllRecipes(data.recipes || []);
        setPinned1(data.pinned1 || '');
        setPinned2(data.pinned2 || '');
      }
    } catch (err) {
      console.error('Error loading pinned recipes:', err);
    }
  }, []);

  useEffect(() => {
    loadPosts();
    loadPinnedRecipes();
  }, [loadPosts, loadPinnedRecipes]);

  const openEdit = async (id: string) => {
    const res = await adminFetch(`/api/admin/blog/${id}`);
    if (res.ok) {
      const data = await res.json();
      setEditing(data);
      setForm({
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt || '',
        cover_image_url: data.cover_image_url || '',
        cover_image_alt_text: data.cover_image_alt_text || '',
        post_type: data.post_type || 'article',
        is_published: data.is_published,
        show_on_homepage: data.show_on_homepage || false,
        recipe_ingredients: Array.isArray(data.recipe_ingredients) ? data.recipe_ingredients : [],
        recipe_method_steps: Array.isArray(data.recipe_method_steps) ? data.recipe_method_steps : [],
        recipe_prep_time: data.recipe_prep_time || '',
        recipe_cook_time: data.recipe_cook_time || '',
        recipe_difficulty: data.recipe_difficulty || '',
        recipe_serves: data.recipe_serves || '',
        recipe_categories: Array.isArray(data.recipe_categories) ? data.recipe_categories : [],
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        excerpt: form.post_type === 'article' ? null : form.excerpt,
        recipe_ingredients: form.post_type === 'recipe' ? form.recipe_ingredients.filter(s => s.trim().length > 0) : [],
        recipe_method_steps: form.post_type === 'recipe' ? form.recipe_method_steps.filter(s => s.trim().length > 0) : [],
        recipe_categories: form.recipe_categories.filter(s => s.trim().length > 0),
      };
      if (isNew) {
        const res = await adminFetch('/api/admin/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setIsNew(false);
          setEditing(null);
          loadPosts();
          loadPinnedRecipes();
        }
      } else if (editing) {
        const res = await adminFetch(`/api/admin/blog/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setEditing(null);
          loadPosts();
          loadPinnedRecipes();
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await adminFetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
    setEditing(null);
    loadPosts();
    loadPinnedRecipes();
  };

  const handleSavePinned = async () => {
    setSavingPinned(true);
    try {
      const res = await adminFetch('/api/admin/blog/pinned-recipes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned1, pinned2 }),
      });
      if (res.ok) {
        setPinnedSavedMessage(true);
        setTimeout(() => setPinnedSavedMessage(false), 3500);
        loadPosts();
      }
    } finally {
      setSavingPinned(false);
    }
  };

  if (editing || isNew) {
    return (
      <div>
        <button
          onClick={() => {
            setEditing(null);
            setIsNew(false);
          }}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          &larr; Back to list
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isNew ? 'New Post' : `Edit: ${editing?.title}`}
        </h1>

        <div className="bg-white rounded-xl border p-6 space-y-4">
          {/* Post Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Post Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="post_type"
                  value="article"
                  checked={form.post_type === 'article'}
                  onChange={() => setForm({ ...form, post_type: 'article' })}
                  className="text-green-600 focus:ring-green-500"
                />
                <span>Article (Journal)</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="post_type"
                  value="recipe"
                  checked={form.post_type === 'recipe'}
                  onChange={() => setForm({ ...form, post_type: 'recipe' })}
                  className="text-green-600 focus:ring-green-500"
                />
                <span>Recipe (Recipe Khazana)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          {form.post_type === 'recipe' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt / Short Summary</label>
              <input
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {form.post_type === 'recipe' ? 'Introduction / Story' : 'Content'}
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={form.post_type === 'recipe' ? 5 : 10}
              className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
            />
          </div>
          <div>
            <ImageField
              value={form.cover_image_url || null}
              onChange={(url) => setForm({ ...form, cover_image_url: url })}
              label="Cover Image"
              aspectRatio="16/9"
              folder={`blog/${form.slug?.trim() || editing?.slug || 'new-post'}/cover`}
              publicId="cover"
              altText={form.cover_image_alt_text || ''}
              onAltTextChange={(alt) => setForm({ ...form, cover_image_alt_text: alt })}
            />
          </div>

          {/* Categories for Both Recipes and Articles */}
          <div className="border-t pt-5">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                {form.post_type === 'recipe' ? 'Recipe Categories' : 'Article Categories / Topics'} (press Enter to add)
              </label>
              <span className="text-[11px] text-gray-400">
                Shows in &ldquo;Found in ...&rdquo; line
              </span>
            </div>

            {/* Active Categories */}
            <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
              {form.recipe_categories.map((cat, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F0F7E8] text-[#1C3F2D] text-xs font-medium rounded-full border border-[#74A832]/40"
                >
                  {cat}
                  <button
                    type="button"
                    onClick={() => {
                      const next = form.recipe_categories.filter((_, i) => i !== idx);
                      setForm({ ...form, recipe_categories: next });
                    }}
                    className="hover:text-red-600 font-bold ml-1 text-sm leading-none"
                  >
                    &times;
                  </button>
                </span>
              ))}
              {form.recipe_categories.length === 0 && (
                <span className="text-xs text-gray-400 italic">No categories added yet</span>
              )}
            </div>

            {/* Add Category Input */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder={form.post_type === 'recipe' ? 'e.g. Salads, Breakfast, Pea Shoots...' : 'e.g. Nutrition, Science, Antioxidants...'}
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = newCatInput.trim();
                    if (val && !form.recipe_categories.includes(val)) {
                      setForm({
                        ...form,
                        recipe_categories: [...form.recipe_categories, val],
                      });
                      setNewCatInput('');
                    }
                  }
                }}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  const val = newCatInput.trim();
                  if (val && !form.recipe_categories.includes(val)) {
                    setForm({
                      ...form,
                      recipe_categories: [...form.recipe_categories, val],
                    });
                    setNewCatInput('');
                  }
                }}
                className="px-4 py-2 bg-[#1C3F2D] hover:bg-[#122A1F] text-white text-xs font-medium rounded-lg"
              >
                Add
              </button>
            </div>

            {/* Quick Suggestion Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-gray-500 font-medium mr-1">Quick Add:</span>
              {(form.post_type === 'recipe'
                ? ['Salads', 'Breakfast', 'Lunch', 'Dinner', 'Quick Bites', 'Mains', 'Smoothies', 'Microgreens', 'Pea Shoots', 'Salad Cress']
                : ['Nutrition', 'Antioxidants', 'Science', 'Farm Stories', 'Growing Guides', 'Cellular Nutrition']
              ).map((preset) => {
                const isSelected = form.recipe_categories.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    disabled={isSelected}
                    onClick={() => {
                      if (!isSelected) {
                        setForm({
                          ...form,
                          recipe_categories: [...form.recipe_categories, preset],
                        });
                      }
                    }}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors ${
                      isSelected
                        ? 'opacity-40 bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-[#2C3E2D] border-gray-300 hover:border-[#74A832] hover:bg-[#F0F7E8]'
                    }`}
                  >
                    + {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Card Preview in W S Bentley Style */}
          <div className="bg-[#FAF9F6] border border-[#E4DDC8] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#1C3F2D] uppercase tracking-wider">
                Live Card Preview (Editorial Design Language)
              </span>
              <span className="text-[11px] text-gray-500 font-mono">
                W S Bentley 4-Col Grid Style
              </span>
            </div>
            <div className="max-w-[260px] bg-white border border-gray-200 p-2 text-center flex flex-col items-center">
              <div className="w-full aspect-[16/10] bg-gray-100 overflow-hidden mb-2.5">
                {form.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.cover_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-mono">
                    Cover Photo
                  </div>
                )}
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74A832] line-clamp-2 leading-snug">
                {form.title.trim() || 'UNTITLED POST'}
              </div>
              <div className="text-[11px] text-[#555555] tracking-wide mt-1">
                Found in {form.recipe_categories.length > 0 ? form.recipe_categories.join(', ') : 'All'} {form.post_type === 'recipe' ? 'Recipes' : 'Articles'}
              </div>
            </div>
          </div>

          {/* Recipe-specific Fields */}
          {form.post_type === 'recipe' && (
            <div className="border-t pt-6 mt-6 space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-800" />
                <span>Recipe Cooking Details</span>
              </h2>

              {/* Prep / Cook / Difficulty / Serves */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Prep Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 15 mins"
                    value={form.recipe_prep_time}
                    onChange={(e) => setForm({ ...form, recipe_prep_time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cook Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 20 mins"
                    value={form.recipe_cook_time}
                    onChange={(e) => setForm({ ...form, recipe_cook_time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Difficulty</label>
                  <input
                    type="text"
                    placeholder="e.g. Easy"
                    value={form.recipe_difficulty}
                    onChange={(e) => setForm({ ...form, recipe_difficulty: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Serves</label>
                  <input
                    type="text"
                    placeholder="e.g. 2-4"
                    value={form.recipe_serves}
                    onChange={(e) => setForm({ ...form, recipe_serves: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Ingredients List */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Ingredients (You Will Need)
                </label>
                <div className="space-y-2">
                  {form.recipe_ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-mono w-6 text-right">•</span>
                      <input
                        type="text"
                        placeholder="e.g. 2 skinless chicken breasts"
                        value={ing}
                        onChange={(e) => {
                          const next = [...form.recipe_ingredients];
                          next[idx] = e.target.value;
                          setForm({ ...form, recipe_ingredients: next });
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = form.recipe_ingredients.filter((_, i) => i !== idx);
                          setForm({ ...form, recipe_ingredients: next });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded text-sm"
                        title="Remove ingredient"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      ...form,
                      recipe_ingredients: [...form.recipe_ingredients, ''],
                    });
                  }}
                  className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  + Add Ingredient
                </button>
              </div>

              {/* Method Steps List */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Method Steps
                </label>
                <div className="space-y-3">
                  {form.recipe_method_steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1.5 rounded mt-1">
                        {idx + 1}
                      </span>
                      <textarea
                        rows={2}
                        placeholder={`Step ${idx + 1} instructions...`}
                        value={step}
                        onChange={(e) => {
                          const next = [...form.recipe_method_steps];
                          next[idx] = e.target.value;
                          setForm({ ...form, recipe_method_steps: next });
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = form.recipe_method_steps.filter((_, i) => i !== idx);
                          setForm({ ...form, recipe_method_steps: next });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded text-sm mt-1"
                        title="Remove step"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      ...form,
                      recipe_method_steps: [...form.recipe_method_steps, ''],
                    });
                  }}
                  className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  + Add Step
                </button>
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm pt-2">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            />
            Published
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.show_on_homepage}
              onChange={(e) => setForm({ ...form, show_on_homepage: e.target.checked })}
            />
            Show on Homepage
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Post'}
            </button>
            {!isNew && editing && (
              <button
                onClick={() => handleDelete(editing.id)}
                className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog &amp; Recipes</h1>
          <p className="text-xs text-gray-500 mt-1">Manage articles and Recipe Khazana entries</p>
        </div>
        <button
          onClick={() => {
            setIsNew(true);
            setForm(emptyPost);
          }}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 self-start sm:self-auto"
        >
          + New Post
        </button>
      </div>

      {/* Homepage Featured Recipes (Recipe Khazana) */}
      <div className="mb-6 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 border border-emerald-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Pin className="w-5 h-5 text-emerald-800 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Homepage Featured Recipes (Recipe Khazana)
              </h2>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Live on Homepage
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Select the 2 recipes showcased on the homepage Recipe Khazana section as <span className="font-mono font-semibold text-emerald-900">Recipe 01 / 02</span> and <span className="font-mono font-semibold text-emerald-900">Recipe 02 / 02</span>.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {pinnedSavedMessage && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-md border border-emerald-300">
                ✓ Pinned recipes updated!
              </span>
            )}
            <button
              onClick={handleSavePinned}
              disabled={savingPinned}
              className="px-4 py-2 bg-[#1C3F2D] hover:bg-[#122A1F] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {savingPinned ? 'Saving...' : 'Save Pinned Recipes'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Slot 1 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Recipe 01 / 02
              </span>
              {pinned1 && (
                <a
                  href={`/recipes/${pinned1}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  View recipe ↗
                </a>
              )}
            </div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Select First Featured Recipe:
            </label>
            <select
              value={pinned1}
              onChange={(e) => setPinned1(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              <option value="">-- Select Recipe 01 --</option>
              {allRecipes.map((r) => (
                <option key={r.id} value={r.slug}>
                  {r.title} {!r.is_published ? '(Draft)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Slot 2 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Recipe 02 / 02
              </span>
              {pinned2 && (
                <a
                  href={`/recipes/${pinned2}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  View recipe ↗
                </a>
              )}
            </div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Select Second Featured Recipe:
            </label>
            <select
              value={pinned2}
              onChange={(e) => setPinned2(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              <option value="">-- Select Recipe 02 --</option>
              {allRecipes.map((r) => (
                <option key={r.id} value={r.slug}>
                  {r.title} {!r.is_published ? '(Draft)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterType === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({posts.length})
        </button>
        <button
          onClick={() => setFilterType('article')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterType === 'article'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Articles
        </button>
        <button
          onClick={() => setFilterType('recipe')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterType === 'recipe'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Recipes
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => {
              const cats = Array.isArray(p.recipe_categories) ? p.recipe_categories.filter((c) => c && c.trim().length > 0) : [];
              return (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{p.title}</span>
                    {p.slug === pinned1 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300 shrink-0">
                        <Pin className="w-3 h-3" />
                        <span>Recipe 01 / 02</span>
                      </span>
                    )}
                    {p.slug === pinned2 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300 shrink-0">
                        <Pin className="w-3 h-3" />
                        <span>Recipe 02 / 02</span>
                      </span>
                    )}
                  </div>
                  {cats.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cats.map((c, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      p.post_type === 'recipe'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {p.post_type === 'recipe' ? 'Recipe' : 'Article'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      p.is_published ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                    }`}
                  >
                    {p.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button
                    onClick={() => openEdit(p.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
        {posts.length === 0 && <p className="p-6 text-center text-gray-400">No posts found</p>}
      </div>
    </div>
  );
}
