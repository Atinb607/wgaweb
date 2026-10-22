'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/adminAuth';
import { formatPrice } from '@/lib/format';
import ImageField from '@/components/admin/ImageField';
import { HEALTH_GOALS } from '@/lib/healthGoals';
import {
  Target,
  Utensils,
  Sprout,
  Lightbulb,
  Trash2,
  Zap,
  Shield,
  Droplet,
  Scissors,
  Sparkles,
  CheckCircle,
  ExternalLink,
  Save,
  PackageBox,
} from '@/components/icons';

function renderHighlightedStory(text: string) {
  if (!text) return null;
  const parts = text.split(/(<u>.*?<\/u>|__.*?__)/g);
  return parts.map((part, i) => {
    if (part.startsWith('<u>') && part.endsWith('</u>')) {
      return (
        <u
          key={i}
          className="decoration-[#B7E23F] decoration-[3px] underline-offset-2 font-medium text-[#122A1F]"
        >
          {part.slice(3, -4)}
        </u>
      );
    }
    if (part.startsWith('__') && part.endsWith('__')) {
      return (
        <u
          key={i}
          className="decoration-[#B7E23F] decoration-[3px] underline-offset-2 font-medium text-[#122A1F]"
        >
          {part.slice(2, -2)}
        </u>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function normalizeBadgeIcon(icon: string): string {
  const norm = (icon || '').toLowerCase().trim();
  if (norm === 'zap' || norm === 'bolt' || icon === '⚡') return 'zap';
  if (norm === 'shield' || icon === '🛡️') return 'shield';
  if (norm === 'droplet' || norm === 'water' || norm === 'drop' || icon === '💧') return 'droplet';
  if (norm === 'scissors' || norm === 'cut' || icon === '✂️') return 'scissors';
  return 'sprout';
}

function renderAdminBadgeIcon(icon: string) {
  const norm = normalizeBadgeIcon(icon);
  if (norm === 'zap') return <Zap className="w-3.5 h-3.5 text-[#1C3F2D]" />;
  if (norm === 'shield') return <Shield className="w-3.5 h-3.5 text-[#1C3F2D]" />;
  if (norm === 'droplet') return <Droplet className="w-3.5 h-3.5 text-[#1C3F2D]" />;
  if (norm === 'scissors') return <Scissors className="w-3.5 h-3.5 text-[#1C3F2D]" />;
  return <Sprout className="w-3.5 h-3.5 text-[#1C3F2D]" />;
}

export interface CategorySetting {
  id?: string;
  name: string;
  display_order: number;
  is_active: boolean;
  product_count?: number;
}

interface Variant {
  id: string;
  label: string;
  net_weight_grams: number;
  price_paise: number;
  stock_qty: number;
  is_active: boolean;
}

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  cloudinary_public_id?: string | null;
  alt_text?: string | null;
  created_at?: string;
}

interface HighlightBadge {
  icon: string;
  label: string;
}

export interface ProductFAQ {
  question: string;
  answer: string;
}

const defaultBadges: HighlightBadge[] = [
  { icon: 'zap', label: '40x Sulforaphane' },
  { icon: 'shield', label: 'Zero Pesticides' },
  { icon: 'droplet', label: 'Mineral RO Grown' },
  { icon: 'scissors', label: 'Cut to Order' },
];

const defaultProductFaqs: ProductFAQ[] = [
  {
    question: 'How fresh are the greens when they arrive?',
    answer:
      'Every tray is cut after you place your order, not pulled from cold storage. Most orders reach your doorstep freshly packed for peak vitality.',
  },
  {
    question: 'How long do they stay fresh at home?',
    answer:
      'Refrigerated and unwashed, most varieties hold up well for 5–7 days. We include specific care instructions with every order.',
  },
  {
    question: 'Are these actually pesticide-free?',
    answer:
      "Yes, grown indoors on soil-free racks, with nothing sprayed at any stage. We're working toward publishing third-party lab results as we scale.",
  },
  {
    question: 'How does shipping and delivery work?',
    answer:
      'We harvest and pack to order so your greens reach your doorstep fresh at peak vitality.',
  },
  {
    question: 'Can restaurants order in bulk?',
    answer:
      'Yes, reach out via our restaurants page for standing orders and bulk pricing.',
  },
  {
    question: 'What if a tray shows up wilted or damaged?',
    answer:
      "Send us a quick photo on WhatsApp within 12 hours of delivery, and we'll replace the tray on our next delivery run or refund it immediately, no questions asked.",
  },
];

export interface DetailAccordion {
  title: string;
  content: string;
}

const defaultDetailAccordions: DetailAccordion[] = [
  {
    title: 'How to Eat & Store',
    content:
      'Keep your tray on the kitchen counter away from direct scorching sun. Add 50ml of water to the bottom drip tray once a day.\n\nWhen ready to eat, simply snip what you need with kitchen scissors right above the root line. Your tray stays fresh and crisp for 7 to 10 days!',
  },
  {
    title: 'Nutrient Profile & Science',
    content:
      'USDA and university studies have confirmed that day 10 microgreens contain between 10x and 40x the vital micronutrients of their full grown counterparts.\n\nHarvested young at the peak of cellular vitality to deliver bioavailable antioxidants straight to your plate.',
  },
  {
    title: 'Growing Method & Purity',
    content:
      'We operate vertical indoor climate racks. No soil, no organic compost pathogens, and absolutely zero pesticide or fertilizer residues.\n\nGrown on sterilized coco peat with 100% reverse osmosis mineral drinking water.',
  },
  {
    title: 'Delivery & Packaging',
    content:
      'Delivered in our reusable food-grade trays. We dispatch orders within hours of the final quality check straight to your doorstep.',
  },
];

interface Product {
  id: string;
  slug: string;
  name: string;
  categories: string[];
  category_orders?: Record<string, number> | null;
  display_order?: number;
  health_goals?: string[];
  description: string;
  description_lead?: string | null;
  description_highlight?: string | null;
  nutrition_notes: string | null;
  thumbnail_url: string | null;
  thumbnail_alt_text?: string | null;
  tags: string[];
  badge_label?: string | null;
  highlight_1?: string | null;
  highlight_2?: string | null;
  is_bundle: boolean;
  is_active: boolean;
  variants?: Variant[];
  images?: ProductImage[];
  detail_highlight_badges?: HighlightBadge[] | null;
  faqs?: ProductFAQ[] | null;
  detail_accordions?: DetailAccordion[] | null;
  pairs_well_with?: string[] | null;
  seo_title?: string | null;
  seo_description?: string | null;
}

const emptyProduct = {
  name: '',
  slug: '',
  categories: [] as string[],
  category_orders: {} as Record<string, number>,
  display_order: 0,
  health_goals: [] as string[],
  description: '',
  description_lead: '',
  description_highlight: '',
  nutrition_notes: '',
  thumbnail_url: '',
  thumbnail_alt_text: '',
  tags: [] as string[],
  badge_label: '',
  highlight_1: '',
  highlight_2: '',
  seo_title: '',
  seo_description: '',
  is_bundle: false,
  is_active: true,
};

const emptyVariant = {
  label: '',
  net_weight_grams: 0,
  price_paise: 0,
  stock_qty: 0,
  is_active: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [tagString, setTagString] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [variantForm, setVariantForm] = useState(emptyVariant);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [catInput, setCatInput] = useState('');
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [badges, setBadges] = useState<HighlightBadge[]>(defaultBadges);
  const [faqs, setFaqs] = useState<ProductFAQ[]>(defaultProductFaqs);
  const [accordions, setAccordions] = useState<DetailAccordion[]>(defaultDetailAccordions);
  const [pairsWellWith, setPairsWellWith] = useState<string[]>(['', '', '']);
  const [subDiscount, setSubDiscount] = useState<number>(15);
  const [subDiscountInput, setSubDiscountInput] = useState<string>('15');
  const [savingSubDiscount, setSavingSubDiscount] = useState(false);
  const [subDiscountSaved, setSubDiscountSaved] = useState(false);

  // Category sequencing & visibility state
  const [categoriesList, setCategoriesList] = useState<CategorySetting[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [savingCategories, setSavingCategories] = useState(false);
  const [categoriesSaved, setCategoriesSaved] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleBadgeChange = (index: number, field: 'icon' | 'label', value: string) => {
    setBadges((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddBadge = () => {
    if (badges.length >= 4) return;
    setBadges((prev) => [...prev, { icon: 'sprout', label: '' }]);
  };

  const handleRemoveBadge = (index: number) => {
    setBadges((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    setFaqs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddFaq = () => {
    setFaqs((prev) => [...prev, { question: '', answer: '' }]);
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveFaq = (index: number, direction: 'up' | 'down') => {
    setFaqs((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleLoadDefaultFaqs = () => {
    if (faqs.length > 0 && !confirm('Replace current FAQs with the 6 standard default questions?')) return;
    setFaqs(defaultProductFaqs);
  };

  const handleAccordionChange = (index: number, field: 'title' | 'content', value: string) => {
    setAccordions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddAccordion = () => {
    setAccordions((prev) => [...prev, { title: '', content: '' }]);
  };

  const handleRemoveAccordion = (index: number) => {
    setAccordions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveAccordion = (index: number, direction: 'up' | 'down') => {
    setAccordions((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleLoadDefaultAccordions = () => {
    if (accordions.length > 0 && !confirm('Replace current accordions with the 4 standard questions?')) return;
    setAccordions(defaultDetailAccordions);
  };

  const handlePairChange = (slotIndex: number, productId: string) => {
    setPairsWellWith((prev) => {
      const next = [...prev];
      next[slotIndex] = productId;
      return next;
    });
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await adminFetch('/api/admin/products');
      if (res.ok) setProducts(await res.json());
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoadingProducts(false);
    }
    loadCategories();
  };

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await adminFetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategoriesList(data);
        setAllCategories(data.map((c: CategorySetting) => c.name));
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadSubDiscount = async () => {
    try {
      const res = await adminFetch('/api/admin/subscription-discount');
      if (res.ok) {
        const data = await res.json();
        if (typeof data.discount_percent === 'number') {
          setSubDiscount(data.discount_percent);
          setSubDiscountInput(String(data.discount_percent));
        }
      }
    } catch (err) {
      console.error('Failed to load subscription discount:', err);
    }
  };

  useEffect(() => {
    loadProducts();
    loadSubDiscount();
    loadCategories();
  }, []);

  const handleSaveCategories = async () => {
    setSavingCategories(true);
    try {
      const res = await adminFetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: categoriesList }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.categories) {
          setCategoriesList(data.categories);
          setAllCategories(data.categories.map((c: CategorySetting) => c.name));
        }
        setCategoriesSaved(true);
        setTimeout(() => setCategoriesSaved(false), 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to update category order.');
      }
    } catch {
      alert('Network error while saving categories.');
    } finally {
      setSavingCategories(false);
    }
  };

  const handleCategoryMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categoriesList.length) return;
    const next = [...categoriesList];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    // Sequential display_orders
    const updated = next.map((cat, idx) => ({
      ...cat,
      display_order: (idx + 1) * 10,
    }));
    setCategoriesList(updated);
  };

  const handleCategoryOrderInput = (index: number, val: string) => {
    const parsed = parseInt(val, 10);
    setCategoriesList((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        display_order: isNaN(parsed) ? 0 : parsed,
      };
      return next;
    });
  };

  const handleToggleCategoryVisibility = (index: number) => {
    setCategoriesList((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        is_active: !next[index].is_active,
      };
      return next;
    });
  };

  const handleAddCategoryDirect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = newCatInput.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!val) {
      alert('Please enter a valid category name.');
      return;
    }
    setAddingCat(true);
    try {
      const res = await adminFetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: val }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.categories) {
          setCategoriesList(data.categories);
          setAllCategories(data.categories.map((c: CategorySetting) => c.name));
        }
        setNewCatInput('');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to add category.');
      }
    } catch {
      alert('Network error while adding category.');
    } finally {
      setAddingCat(false);
    }
  };

  const handleDeleteCategoryDirect = async (name: string, count: number = 0) => {
    const msg = count > 0
      ? `Category "${name}" is tagged on ${count} product(s). Are you sure you want to remove it from storefront display settings?`
      : `Remove category "${name}" from storefront display settings?`;
    if (!confirm(msg)) return;

    try {
      const res = await adminFetch(`/api/admin/categories?name=${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.categories) {
          setCategoriesList(data.categories);
          setAllCategories(data.categories.map((c: CategorySetting) => c.name));
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to delete category.');
      }
    } catch {
      alert('Network error while deleting category.');
    }
  };

  const handleSaveSubDiscount = async () => {
    const val = parseFloat(subDiscountInput);
    if (isNaN(val) || val < 0 || val > 100) {
      alert('Please enter a valid percentage between 0 and 100.');
      return;
    }
    setSavingSubDiscount(true);
    try {
      const res = await adminFetch('/api/admin/subscription-discount', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount_percent: val }),
      });
      if (res.ok) {
        const data = await res.json();
        setSubDiscount(data.discount_percent);
        setSubDiscountInput(String(data.discount_percent));
        setSubDiscountSaved(true);
        setTimeout(() => setSubDiscountSaved(false), 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to update subscription discount.');
      }
    } catch {
      alert('Network error while saving subscription discount.');
    } finally {
      setSavingSubDiscount(false);
    }
  };

  const handleAddCategory = (rawCat: string) => {
    const val = rawCat.trim().toLowerCase().replace(/\s+/g, '-');
    if (!val) return;
    if (!form.categories.includes(val)) {
      const existingOrders = Object.values(form.category_orders || {}).filter((n) => typeof n === 'number' && n > 0) as number[];
      const nextOrder = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 1;
      setForm((prev) => ({
        ...prev,
        categories: [...prev.categories, val],
        category_orders: {
          ...(prev.category_orders || {}),
          [val]: nextOrder,
        },
        display_order: prev.categories.length === 0 ? nextOrder : prev.display_order,
      }));
    }
  };

  const handleRemoveCategory = (catToRemove: string) => {
    setForm((prev) => {
      const nextOrders = { ...(prev.category_orders || {}) };
      delete nextOrders[catToRemove];
      return {
        ...prev,
        categories: prev.categories.filter((c) => c !== catToRemove),
        category_orders: nextOrders,
      };
    });
  };

  const handleCategoryOrderChange = (cat: string, value: string) => {
    const num = value === '' ? 0 : parseInt(value, 10);
    const validNum = isNaN(num) || num < 0 ? 0 : num;
    setForm((prev) => ({
      ...prev,
      category_orders: {
        ...(prev.category_orders || {}),
        [cat]: validNum,
      },
      display_order: prev.categories[0] === cat ? validNum : prev.display_order,
    }));
  };

  const loadProduct = async (id: string) => {
    const res = await adminFetch(`/api/admin/products/${id}`);
    if (res.ok) {
      const data = await res.json();
      setEditing(data);
      setForm({
        name: data.name || '',
        slug: data.slug || '',
        categories: Array.isArray(data.categories) ? data.categories : (data.category ? [data.category] : []),
        category_orders: (data.category_orders && typeof data.category_orders === 'object' && !Array.isArray(data.category_orders)) ? data.category_orders : {},
        display_order: typeof data.display_order === 'number' ? data.display_order : 0,
        health_goals: Array.isArray(data.health_goals) ? data.health_goals : [],
        description: data.description || '',
        description_lead: data.description_lead || '',
        description_highlight: data.description_highlight || '',
        nutrition_notes: data.nutrition_notes || '',
        thumbnail_url: data.thumbnail_url || '',
        thumbnail_alt_text: data.thumbnail_alt_text || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        badge_label: data.badge_label || '',
        highlight_1: data.highlight_1 || '',
        highlight_2: data.highlight_2 || '',
        seo_title: data.seo_title || '',
        seo_description: data.seo_description || '',
        is_bundle: data.is_bundle ?? false,
        is_active: data.is_active ?? true,
      });
      setTagString(Array.isArray(data.tags) ? data.tags.join(', ') : '');
      setVariants(data.variants || []);
      setImages(data.images || []);
      if (Array.isArray(data.detail_highlight_badges) && data.detail_highlight_badges.length > 0) {
        setBadges(data.detail_highlight_badges);
      } else {
        setBadges(defaultBadges);
      }
      if (Array.isArray(data.faqs) && data.faqs.length > 0) {
        setFaqs(data.faqs);
      } else {
        setFaqs(defaultProductFaqs);
      }
      if (Array.isArray(data.detail_accordions) && data.detail_accordions.length > 0) {
        setAccordions(data.detail_accordions);
      } else {
        setAccordions(defaultDetailAccordions);
      }
      if (Array.isArray(data.pairs_well_with)) {
        setPairsWellWith([
          data.pairs_well_with[0] || '',
          data.pairs_well_with[1] || '',
          data.pairs_well_with[2] || '',
        ]);
      } else {
        setPairsWellWith(['', '', '']);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const parsedTags = Array.from(
        new Set(
          tagString
            .split(',')
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)
        )
      ).slice(0, 10);

      const payload = {
        ...form,
        tags: parsedTags,
        detail_highlight_badges: badges,
        faqs: faqs.filter((f) => f.question.trim() || f.answer.trim()),
        detail_accordions: accordions.filter((a) => a.title.trim() || a.content.trim()),
        pairs_well_with: pairsWellWith.filter(Boolean),
      };

      if (isNew) {
        const res = await adminFetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setIsNew(false);
          loadProducts();
          loadProduct(created.id);
        }
      } else if (editing) {
        const res = await adminFetch(`/api/admin/products/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setProducts((prev) =>
            prev.map((p) => (p.id === editing.id ? { ...p, ...updated } : p))
          );
          loadProducts();
          loadProduct(editing.id);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this product?')) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: false } : p))
    );
    await adminFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    setEditing(null);
    loadProducts();
  };

  const handleToggleProductStatus = async (id: string, currentActive: boolean) => {
    const nextActive = !currentActive;
    setTogglingId(id);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: nextActive } : p))
    );
    try {
      const res = await adminFetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextActive }),
      });
      if (!res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_active: currentActive } : p))
        );
        alert('Failed to update product status');
      } else {
        loadProducts();
      }
    } catch (err) {
      console.error('Toggle product error:', err);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: currentActive } : p))
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleVariantSave = async (v: Variant) => {
    await adminFetch(`/api/admin/variants/${v.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: v.label,
        net_weight_grams: v.net_weight_grams,
        price_paise: v.price_paise,
        stock_qty: v.stock_qty,
        is_active: v.is_active,
      }),
    });
    if (editing) loadProduct(editing.id);
  };

  const handleVariantCreate = async () => {
    if (!editing) return;
    const res = await adminFetch(`/api/admin/products/${editing.id}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(variantForm),
    });
    if (res.ok) {
      setVariantForm(emptyVariant);
      setShowVariantForm(false);
      loadProduct(editing.id);
    }
  };

  const handleVariantDelete = async (vid: string) => {
    if (!confirm('Deactivate this variant?')) return;
    await adminFetch(`/api/admin/variants/${vid}`, { method: 'DELETE' });
    if (editing) loadProduct(editing.id);
  };

  // ── Editing/creating view (Synchronized 1:1 with Storefront) ──
  if (editing || isNew) {
    const lowestPrice = variants.length > 0 ? Math.min(...variants.map((v) => v.price_paise)) : 0;

    return (
      <div className="pb-32">
        {/* ── Top Header & Sticky Action Bar ── */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setIsNew(false);
                }}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                &larr; Product List
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                    {isNew ? 'Create New Product' : (form.name || 'Edit Product')}
                  </h1>
                  {form.badge_label && (
                    <span className="bg-[#8B2D46] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                      {form.badge_label}
                    </span>
                  )}
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      form.is_active
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {form.is_active ? '● Published' : '○ Draft'}
                  </span>
                </div>
                {!isNew && form.slug && (
                  <p className="text-xs text-gray-400 font-mono truncate">
                    /products/{form.slug}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isNew && editing && (
                <a
                  href={`/products/${form.slug || editing.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Open live storefront page in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Live Page</span>
                </a>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-gray-900 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : (isNew ? 'Save & Create Product' : 'Save Changes')}</span>
              </button>
              {!isNew && editing && (
                <button
                  type="button"
                  onClick={() => handleDelete(editing.id)}
                  className="px-3 py-2 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 border border-red-200 transition-colors"
                >
                  Deactivate
                </button>
              )}
            </div>
          </div>

          {/* Quick Jump Anchor Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-0.5 text-xs no-scrollbar">
            <span className="text-[11px] font-medium text-gray-400 shrink-0 mr-1">Jump to:</span>
            <a href="#sec-identity" className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-emerald-50 hover:text-emerald-900 text-gray-700 shrink-0 font-medium transition-colors">
              1. Identity &amp; Tags
            </a>
            <a href="#sec-editorial" className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/60 shrink-0 font-semibold transition-colors">
              2. Editorial Story (Hero)
            </a>
            <a href="#sec-badges" className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-emerald-50 hover:text-emerald-900 text-gray-700 shrink-0 font-medium transition-colors">
              3. Feature Badges
            </a>
            <a href="#sec-media" className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-emerald-50 hover:text-emerald-900 text-gray-700 shrink-0 font-medium transition-colors">
              4. Photos &amp; Carousel
            </a>
            <a href="#sec-variants" className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-emerald-50 hover:text-emerald-900 text-gray-700 shrink-0 font-medium transition-colors">
              5. Buy Box Variants
            </a>
            <a href="#sec-accordions" className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-emerald-50 hover:text-emerald-900 text-gray-700 shrink-0 font-medium transition-colors">
              6. Accordions &amp; Science
            </a>
            <a href="#sec-pairs" className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-emerald-50 hover:text-emerald-900 text-gray-700 shrink-0 font-medium transition-colors">
              7. Companion Products
            </a>
            <a href="#sec-faqs" className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-emerald-50 hover:text-emerald-900 text-gray-700 shrink-0 font-medium transition-colors">
              8. Product FAQs
            </a>
            <a href="#sec-catalog-cards" className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 shrink-0 font-semibold transition-colors">
              9. Catalog Card Subtitles
            </a>
            <a href="#sec-seo" className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-emerald-50 hover:text-emerald-900 text-gray-700 shrink-0 font-medium transition-colors">
              10. SEO
            </a>
          </div>
        </div>

        <div className="space-y-8 max-w-7xl mx-auto">
          {/* ========================================================================= */}
          {/* SECTION 1: CORE IDENTITY & STOREFRONT STATUS */}
          {/* ========================================================================= */}
          <div id="sec-identity" className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wider">
                    Storefront Section 1
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    Product Identity &amp; Categorization
                  </h2>
                </div>
                <p className="text-xs text-gray-500">
                  Primary title, URL slug, category display sequence, and storefront visibility.
                </p>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200 text-xs shrink-0">
                <label className="flex items-center gap-2 font-medium text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Published on Store</span>
                </label>
                <span className="text-gray-300">|</span>
                <label className="flex items-center gap-2 font-medium text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_bundle}
                    onChange={(e) => setForm({ ...form, is_bundle: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Bundle Pack</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Product Name <span className="text-emerald-700 font-normal font-mono">(Storefront PDP &lt;h1&gt;)</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Pink Radish"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  URL Slug <span className="text-gray-400 font-normal font-mono">(/products/[slug])</span>
                </label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="e.g. pink-radish"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Badge Label <span className="text-gray-400 font-normal">(Floating badge over product photo)</span>
                </label>
                <input
                  value={form.badge_label}
                  onChange={(e) => setForm({ ...form, badge_label: e.target.value })}
                  placeholder="e.g. Bestseller, New Harvest, Customer Favorite"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Shown as the plum pill on top left of product photo on both catalog grid &amp; detail page.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Categories &amp; Display Order
                  </label>
                  <span className="text-[11px] text-gray-400">Order # in category tab</span>
                </div>
                {form.categories.length > 0 && (
                  <div className="space-y-1.5 mb-2.5">
                    {form.categories.map((cat) => (
                      <div
                        key={cat}
                        className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-gray-800 capitalize truncate">
                            {cat.replace(/-/g, ' ')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(cat)}
                            className="text-gray-400 hover:text-red-500 font-bold ml-1 text-base leading-none"
                            title="Remove category"
                          >
                            &times;
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <label className="text-[11px] text-gray-500 whitespace-nowrap font-medium">
                            Sequence:
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={form.category_orders?.[cat] || ''}
                            onChange={(e) => handleCategoryOrderChange(cat, e.target.value)}
                            placeholder="1"
                            className="w-16 px-2 py-0.5 border border-gray-300 rounded text-center text-xs font-mono font-bold text-emerald-800 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <input
                    value={catInput}
                    onChange={(e) => { setCatInput(e.target.value); setShowCatDropdown(true); }}
                    onFocus={() => setShowCatDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCatDropdown(false), 200)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && catInput.trim()) {
                        e.preventDefault();
                        handleAddCategory(catInput);
                        setCatInput('');
                        setShowCatDropdown(false);
                      }
                    }}
                    placeholder="Type to search or add a category…"
                    className="w-full px-3.5 py-2 border rounded-xl text-sm"
                  />
                  {showCatDropdown && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-auto">
                      {allCategories
                        .filter(c => !form.categories.includes(c) && c.toLowerCase().includes(catInput.toLowerCase()))
                        .map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleAddCategory(cat);
                              setCatInput('');
                              setShowCatDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 capitalize"
                          >
                            {cat.replace(/-/g, ' ')}
                          </button>
                        ))}
                      {catInput.trim() && !allCategories.includes(catInput.trim().toLowerCase().replace(/\s+/g, '-')) && (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleAddCategory(catInput);
                            setCatInput('');
                            setShowCatDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 font-medium"
                        >
                          + Create &ldquo;{catInput.trim()}&rdquo;
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Health Goals Multi-Select Dropdown */}
              <div className="sm:col-span-2 bg-[#F6FAF7] border border-emerald-200/90 rounded-xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div>
                    <label className="block text-sm font-semibold text-emerald-950 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-emerald-800" />
                      <span>Health Goals (Shop by Health Goal)</span>
                    </label>
                    <p className="text-xs text-emerald-800/80">
                      Assign one or multiple of the 8 health goals to display this product under those goals on the website.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          health_goals: HEALTH_GOALS.map((g) => g.id),
                        }))
                      }
                      className="text-[11px] font-medium text-emerald-700 hover:text-emerald-900 bg-white px-2.5 py-1 rounded-md border border-emerald-300 hover:bg-emerald-50 transition-colors shadow-xs"
                    >
                      Select All 8 Goals
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          health_goals: [],
                        }))
                      }
                      className="text-[11px] font-medium text-gray-600 hover:text-red-700 bg-white px-2.5 py-1 rounded-md border border-gray-300 hover:bg-red-50 transition-colors shadow-xs"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Selected Health Goal Badges */}
                <div className="flex flex-wrap gap-1.5 mb-3 min-h-[32px] items-center">
                  {form.health_goals && form.health_goals.length > 0 ? (
                    form.health_goals.map((goalId) => {
                      const goalDef = HEALTH_GOALS.find(
                        (g) => g.id === goalId || g.slug === goalId || g.aliases.includes(goalId)
                      );
                      return (
                        <span
                          key={goalId}
                          className="inline-flex items-center gap-1.5 bg-white text-[#1C3F2D] text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-300 shadow-xs"
                        >
                          <span>{goalDef?.title || goalId}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                health_goals: prev.health_goals.filter((g) => g !== goalId),
                              }))
                            }
                            className="text-gray-400 hover:text-red-600 font-bold ml-1 text-sm leading-none"
                            title="Remove this health goal"
                          >
                            &times;
                          </button>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-emerald-700/70 italic">
                      No health goals selected. Choose from the dropdown below:
                    </span>
                  )}
                </div>

                {/* Health Goal Select Dropdown */}
                <div className="relative">
                  <select
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !form.health_goals.includes(val)) {
                        setForm((prev) => ({
                          ...prev,
                          health_goals: [...prev.health_goals, val],
                        }));
                      }
                    }}
                    className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-2 text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-xs cursor-pointer"
                  >
                    <option value="" disabled>
                      + Select a health goal from dropdown...
                    </option>
                    {HEALTH_GOALS.map((goal) => {
                      const isSelected = form.health_goals.includes(goal.id);
                      return (
                        <option
                          key={goal.id}
                          value={goal.id}
                          disabled={isSelected}
                          className={isSelected ? 'text-gray-400 bg-gray-50' : 'text-gray-900'}
                        >
                          {isSelected
                            ? `✓ ${goal.title} (Already selected)`
                            : `${goal.title} — ${goal.subtitle}`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: HERO EDITORIAL STORY (SHOWN DIRECTLY UNDER TITLE) */}
          {/* ========================================================================= */}
          <div id="sec-editorial" className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 shadow-xs">
            <div className="pb-4 mb-6 border-b">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wider">
                  Storefront Detail Page: Under Title
                </span>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  Product Detail Hero Story &amp; Editorial Description
                </h2>
              </div>
              <p className="text-xs text-gray-500">
                These 3 fields render directly underneath the product title on <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">/products/[slug]</code> in the Newsreader serif typography.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
              {/* Form Input Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    1. Description Lead / Hook <span className="text-emerald-700 font-normal">(Bold Italic opening sentence)</span>
                  </label>
                  <input
                    type="text"
                    value={form.description_lead}
                    onChange={(e) => setForm({ ...form, description_lead: e.target.value })}
                    placeholder="e.g. Crisp, colourful and peppery, with a live mooli-like kick"
                    className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Renders at the very start of the first paragraph in bold italic styling.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    2. Description Body <span className="text-gray-500 font-normal">(Main story paragraph)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="e.g. Rich in glucoraphasatin. Actively supports natural liver detoxification via activation of phase II liver detox enzymes and works to reduce digestive tract inflammation."
                    className="w-full px-3.5 py-2.5 border rounded-xl text-sm leading-relaxed focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    The main story paragraph explaining flavor, bioactive nutrition, and harvest vitality.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    3. Description Highlight / Callout <span className="text-emerald-700 font-normal">(Paragraph 2 with Lime Underline)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={form.description_highlight}
                    onChange={(e) => setForm({ ...form, description_highlight: e.target.value })}
                    placeholder="e.g. Brightens salads and chaats, or carries up to <u>40 times the concentrated sulforaphane</u>."
                    className="w-full px-3.5 py-2.5 border rounded-xl text-sm leading-relaxed focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                  />
                  <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Wrap key phrases with <code className="bg-gray-100 px-1 py-0.2 rounded text-emerald-800 font-mono text-[10.5px]">&lt;u&gt;text&lt;/u&gt;</code> or <code className="bg-gray-100 px-1 py-0.2 rounded text-emerald-800 font-mono text-[10.5px]">__text__</code> to highlight them with the lime accent underline.</span>
                  </p>
                </div>
              </div>

              {/* Live Storefront Hero Preview Column */}
              <div className="bg-[#FFFDF8] border border-[#E4DDC8] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E4DDC8]">
                    <span className="font-mono text-[10.5px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Storefront Hero Preview
                    </span>
                    <span className="text-[11px] text-[#5C6B60]">Matches wildaboutgreens.com/products/[slug]</span>
                  </div>

                  <h3 className="font-serif font-medium text-3xl sm:text-4xl text-[#151F19] leading-[1.08] tracking-tight mb-4">
                    {form.name || 'Pink Radish'}
                  </h3>

                  <div className="font-editorial text-[17px] leading-[1.62] text-[#33402F] space-y-3">
                    {(form.description_lead || form.description) ? (
                      <p>
                        {form.description_lead && (
                          <span className="font-medium italic text-[#122A1F]">
                            {form.description_lead}{' '}
                          </span>
                        )}
                        {form.description || ''}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic text-sm">
                        Enter a lead hook and description body to preview here...
                      </p>
                    )}

                    {form.description_highlight && (
                      <p>
                        {renderHighlightedStory(form.description_highlight)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-[#E4DDC8]/60 flex items-center gap-2 text-xs text-[#5C6B60]">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  <span>Rendered with Newsreader Serif &amp; signature lime accent.</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: FEATURE BADGES & CHIPS (SHOWN UNDER EDITORIAL STORY) */}
          {/* ========================================================================= */}
          <div id="sec-badges" className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wider">
                    Storefront Detail Page: Under Description
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    Feature Badges
                  </h2>
                </div>
                <p className="text-xs text-gray-500">
                  Up to 4 highlight badges shown directly beneath the description on the product page (e.g. Cut to Order, Zero Pesticides, Freshly Harvested).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBadges(defaultBadges)}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg text-gray-700 transition-colors"
                  title="Reset to the 4 standard badges"
                >
                  Load Standard Badges
                </button>
                {badges.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddBadge}
                    className="px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    + Add Badge
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Badges rows */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Detail Highlight Badges (Max 4 Chips)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {badges.map((b, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200 shadow-xs"
                    >
                      <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-xs">
                        {renderAdminBadgeIcon(b.icon)}
                      </div>
                      <select
                        value={normalizeBadgeIcon(b.icon)}
                        onChange={(e) => handleBadgeChange(idx, 'icon', e.target.value)}
                        className="w-36 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-800 outline-none focus:ring-1 focus:ring-emerald-500 shrink-0"
                      >
                        <option value="sprout">🌱 Living Greens</option>
                        <option value="shield">🛡️ Zero Pesticides</option>
                        <option value="droplet">💧 Mineral RO Grown</option>
                        <option value="scissors">✂️ Cut to Order</option>
                        <option value="zap">⚡ High Nutrition</option>
                      </select>
                      <input
                        type="text"
                        placeholder="e.g. 40x Sulforaphane"
                        value={b.label}
                        onChange={(e) => handleBadgeChange(idx, 'label', e.target.value)}
                        className="flex-1 min-w-0 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-800 outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveBadge(idx)}
                        className="text-gray-400 hover:text-red-600 p-1 text-sm font-bold shrink-0"
                        title="Remove badge"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search Keywords (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Search Keywords / Tags <span className="text-gray-400 font-normal">(Optional — internal search only, not displayed as chips on storefront)</span>
                </label>
                <input
                  value={tagString}
                  onChange={(e) => setTagString(e.target.value)}
                  placeholder="e.g. salad greens, crunchy (optional keywords)"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none text-gray-700 bg-gray-50/50"
                />
              </div>

              {/* Live Storefront Chips Preview */}
              <div className="bg-[#FFFDF8] border border-[#E4DDC8] rounded-xl p-4">
                <span className="font-mono text-[10.5px] font-bold text-emerald-800 uppercase tracking-wider block mb-2.5">
                  Live Chips Preview on Product Page:
                </span>
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E4DDC8] text-xs font-semibold text-[#122A1F] shadow-xs"
                    >
                      {renderAdminBadgeIcon(badge.icon)}
                      <span>{badge.label || 'Badge Label'}</span>
                    </span>
                  ))}

                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: PRODUCT MEDIA & GALLERY CAROUSEL */}
          {/* ========================================================================= */}
          <div id="sec-media" className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 shadow-xs">
            <div className="pb-4 mb-6 border-b">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wider">
                  Storefront Detail Page: Left Carousel
                </span>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  Product Images &amp; Carousel Gallery
                </h2>
              </div>
              <p className="text-xs text-gray-500">
                Primary thumbnail and multiple high-resolution photos for the 1:1 square storefront gallery carousel.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Primary Thumbnail Field */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                      Primary Thumbnail (Catalog &amp; Detail)
                    </span>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded font-bold">
                      1:1 SQUARE
                    </span>
                  </div>
                  <ImageField
                    value={form.thumbnail_url || null}
                    onChange={(url) => setForm((prev) => ({ ...prev, thumbnail_url: url }))}
                    label=""
                    aspectRatio="1/1"
                    folder={`products/${form.slug?.trim() || editing?.slug || 'new-product'}/thumbnail`}
                    publicId="thumbnail"
                    altText={form.thumbnail_alt_text || ''}
                    onAltTextChange={(val) => setForm((prev) => ({ ...prev, thumbnail_alt_text: val }))}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-3 pt-3 border-t">
                  This image appears on the main /products grid, recipe pairings, and as the initial slide on the product page.
                </p>
              </div>

              {/* Gallery Carousel Images Column */}
              <div className="lg:col-span-2 bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                      Carousel Gallery Photos ({images.length})
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Additional angles, macro close-ups, harvest shots, and packaging images.
                    </p>
                  </div>
                  {!isNew && editing && (
                    <span className="text-[10px] font-mono text-gray-500 bg-white border px-2 py-0.5 rounded font-bold">
                      Interactive Carousel
                    </span>
                  )}
                </div>

                {isNew ? (
                  <div className="p-6 bg-white border border-dashed rounded-xl text-center space-y-2">
                    <Lightbulb className="w-6 h-6 text-amber-600 mx-auto" />
                    <p className="text-sm font-semibold text-gray-800">
                      Multi-Photo Carousel Available Upon Saving
                    </p>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      Once you click &ldquo;Save &amp; Create Product&rdquo;, a database ID is assigned and you can upload multiple carousel gallery images right here.
                    </p>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="mt-2 px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg"
                    >
                      {saving ? 'Saving...' : 'Save Product Now to Unlock Gallery'}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        className="border rounded-xl p-2 bg-white flex flex-col justify-between space-y-2 shadow-xs"
                      >
                        <ImageField
                          value={img.image_url}
                          onChange={async (url, publicId) => {
                            await adminFetch(`/api/admin/images/${img.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                image_url: url,
                                cloudinary_public_id: publicId,
                              }),
                            });
                            if (editing) loadProduct(editing.id);
                          }}
                          aspectRatio="1/1"
                          folder={`products/${form.slug?.trim() || editing?.slug || 'product'}/gallery`}
                          altText={img.alt_text || ''}
                          onAltTextChange={async (alt) => {
                            await adminFetch(`/api/admin/images/${img.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ alt_text: alt }),
                            });
                            if (editing) loadProduct(editing.id);
                          }}
                        />
                        <div className="flex items-center justify-between gap-1 pt-1 border-t text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-gray-500 font-medium">Order:</span>
                            <input
                              type="number"
                              defaultValue={img.display_order}
                              onBlur={async (e) => {
                                const newOrder = parseInt(e.target.value, 10);
                                if (!isNaN(newOrder) && newOrder !== img.display_order) {
                                  await adminFetch(`/api/admin/images/${img.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ display_order: newOrder }),
                                  });
                                  if (editing) loadProduct(editing.id);
                                }
                              }}
                              className="w-10 px-1 py-0.5 border rounded text-xs text-center bg-white font-mono"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm('Delete this gallery image?')) return;
                              await adminFetch(`/api/admin/images/${img.id}`, { method: 'DELETE' });
                              if (editing) loadProduct(editing.id);
                            }}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold px-1"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Gallery Image Box */}
                    <div className="border border-dashed border-gray-300 rounded-xl p-2 bg-white flex flex-col justify-between items-center text-center shadow-xs">
                      <ImageField
                        value={null}
                        onChange={async (url, publicId) => {
                          if (!editing) return;
                          const addRes = await adminFetch(`/api/admin/products/${editing.id}/images`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              image_url: url,
                              display_order: images.length,
                              cloudinary_public_id: publicId,
                            }),
                          });
                          if (addRes.ok) {
                            loadProduct(editing.id);
                          }
                        }}
                        aspectRatio="1/1"
                        folder={`products/${form.slug?.trim() || editing?.slug || 'product'}/gallery`}
                      />
                      <p className="text-[11px] text-emerald-800 font-medium mt-1">+ Upload Carousel Photo</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 5: BUY BOX VARIANTS & PRICING */}
          {/* ========================================================================= */}
          <div id="sec-variants" className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wider">
                    Storefront Detail Page: Buy Box
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    Tray Sizes, Weights &amp; Pricing Variants
                  </h2>
                </div>
                <p className="text-xs text-gray-500">
                  Configures the tray size selector and single-tray standard base price. The storewide subscription routine automatically applies <strong className="text-emerald-700 font-semibold">{subDiscount}% off</strong> for weekly subscribers.
                </p>
              </div>

              {!isNew && (
                <button
                  type="button"
                  onClick={() => setShowVariantForm(true)}
                  className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
                >
                  + Add Variant Size
                </button>
              )}
            </div>

            {isNew ? (
              <div className="p-6 bg-gray-50 border border-dashed rounded-xl text-center space-y-2">
                <PackageBox className="w-6 h-6 text-gray-400 mx-auto" />
                <p className="text-sm font-semibold text-gray-800">
                  Variants Available Once Product Is Saved
                </p>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Save this new product to configure tray sizes (e.g. 30g Harvested Greens, 50g Harvested Greens, 100g Live Tray), pricing in Rupees, and live stock count.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {showVariantForm && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                      Add New Tray Variant
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Variant Label</label>
                        <input
                          placeholder="e.g. 50g Harvested Greens"
                          value={variantForm.label}
                          onChange={(e) => {
                            const newLabel = e.target.value;
                            const extracted = extractWeightFromLabel(newLabel);
                            setVariantForm((prev) => ({
                              ...prev,
                              label: newLabel,
                              ...(extracted !== null && !prev.net_weight_grams ? { net_weight_grams: extracted } : {}),
                            }));
                          }}
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Net Weight (Grams)</label>
                        <input
                          type="number"
                          placeholder="50"
                          value={variantForm.net_weight_grams || ''}
                          onChange={(e) =>
                            setVariantForm({ ...variantForm, net_weight_grams: Number(e.target.value) })
                          }
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Price (paise — ₹1 = 100 paise)</label>
                        <input
                          type="number"
                          placeholder="25000 (= ₹250.00)"
                          value={variantForm.price_paise || ''}
                          onChange={(e) =>
                            setVariantForm({ ...variantForm, price_paise: Number(e.target.value) })
                          }
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-mono"
                        />
                        {variantForm.price_paise > 0 && (
                          <span className="text-[11px] text-emerald-700 font-medium">
                            = {formatPrice(variantForm.price_paise)}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Stock Quantity</label>
                        <input
                          type="number"
                          placeholder="100"
                          value={variantForm.stock_qty || ''}
                          onChange={(e) =>
                            setVariantForm({ ...variantForm, stock_qty: Number(e.target.value) })
                          }
                          className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleVariantCreate}
                        className="px-4 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800"
                      >
                        Save Variant
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowVariantForm(false)}
                        className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full min-w-[550px] text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                        <th className="py-2.5 px-4">Variant Label</th>
                        <th className="py-2.5 px-3">Weight (g)</th>
                        <th className="py-2.5 px-3">Standard Price</th>
                        <th className="py-2.5 px-3">Stock Qty</th>
                        <th className="py-2.5 px-3">Active</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {variants.map((v) => (
                        <VariantRow
                          key={v.id}
                          variant={v}
                          onSave={handleVariantSave}
                          onDelete={handleVariantDelete}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 6: PRODUCT DETAIL ACCORDIONS & NUTRITION PROFILE */}
          {/* ========================================================================= */}
          <div id="sec-accordions" className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wider">
                    Storefront Detail Page: Below Buy Box
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    Product Detail Accordions &amp; Nutrition Science
                  </h2>
                </div>
                <p className="text-xs text-gray-500">
                  The 4 expandable question &amp; answer sections shown below the buy box (How to Eat &amp; Store, Nutrient Science, Purity, Delivery).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadDefaultAccordions}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg text-gray-700 transition-colors"
                  title="Reset to 4 standard accordion questions"
                >
                  Load Standard Accordions
                </button>
                <button
                  type="button"
                  onClick={handleAddAccordion}
                  className="px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  + Add Accordion
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {/* Accordions List */}
              <div className="space-y-3">
                {accordions.map((acc, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between gap-2 border-b pb-2">
                      <span className="text-xs font-mono font-bold text-gray-600">
                        Accordion #{idx + 1}: {acc.title || 'Untitled'}
                      </span>
                      <div className="flex items-center gap-1">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMoveAccordion(idx, 'up')}
                            className="px-2 py-0.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                            title="Move Up"
                          >
                            ↑ Up
                          </button>
                        )}
                        {idx < accordions.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMoveAccordion(idx, 'down')}
                            className="px-2 py-0.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                            title="Move Down"
                          >
                            ↓ Down
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveAccordion(idx)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-0.5 hover:bg-red-50 rounded ml-1"
                          title="Remove this item"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        placeholder="e.g. How to Eat & Store"
                        value={acc.title}
                        onChange={(e) => handleAccordionChange(idx, 'title', e.target.value)}
                        className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Content / Instructions</label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Keep your tray on the kitchen counter..."
                        value={acc.content}
                        onChange={(e) => handleAccordionChange(idx, 'content', e.target.value)}
                        className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Nutrition Notes Field */}
              <div className="bg-[#F6FAF7] border border-emerald-200 rounded-xl p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-800" />
                    <span>Specific Nutrition &amp; Science Notes</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-white border border-emerald-300 px-2 py-0.5 rounded">
                    Appears inside Accordion #2
                  </span>
                </div>
                <p className="text-xs text-emerald-800/80">
                  Optional detailed bioactive breakdown rendered in a dedicated highlighted box inside the &ldquo;Nutrient Profile &amp; Science&rdquo; accordion on the product page (e.g. specific vitamin counts, glucoraphasatin levels, or antioxidant research).
                </p>
                <textarea
                  value={form.nutrition_notes}
                  onChange={(e) => setForm({ ...form, nutrition_notes: e.target.value })}
                  rows={2}
                  placeholder="e.g. Rich in glucoraphasatin (precursor to raphasatin). Contains 4x higher vitamin C and 10x higher folate compared to mature root radishes."
                  className="w-full px-3.5 py-2 border border-emerald-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 7: COMPANION PRODUCTS ("PAIRS WELL WITH") */}
          {/* ========================================================================= */}
          <div id="sec-pairs" className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 shadow-xs">
            <div className="pb-4 mb-6 border-b">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wider">
                  Storefront Detail Page: Companion Section
                </span>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  &ldquo;Pairs Well With&rdquo; Recommended Companion Products (3 Products)
                </h2>
              </div>
              <p className="text-xs text-gray-500">
                Choose the 3 companion products displayed directly below the description accordions on this product&apos;s page.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[0, 1, 2].map((slotIdx) => (
                <div key={slotIdx} className="bg-gray-50 p-4 border rounded-xl space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">
                      Companion #{slotIdx + 1}
                    </label>
                    <Utensils className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <select
                    value={pairsWellWith[slotIdx] || ''}
                    onChange={(e) => handlePairChange(slotIdx, e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- Choose Product --</option>
                    {products
                      .filter((p) => p.id !== editing?.id && p.is_active)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                  {pairsWellWith[slotIdx] && (
                    <p className="text-[11px] text-emerald-700 font-medium">
                      ✓ Selected: {products.find((p) => p.id === pairsWellWith[slotIdx])?.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 8: PRODUCT FAQS (EXPANDABLE QUESTIONS ABOVE FOOTER) */}
          {/* ========================================================================= */}
          <div id="sec-faqs" className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wider">
                    Storefront Detail Page: Bottom FAQ Section
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    Product FAQs ({faqs.length})
                  </h2>
                </div>
                <p className="text-xs text-gray-500">
                  Questions and answers specific to this variety, shown in the expandable FAQ section above the footer.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadDefaultFaqs}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-lg transition-colors"
                  title="Reset to 6 standard FAQ templates"
                >
                  Load Standard FAQs
                </button>
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  + Add FAQ
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between gap-2 border-b pb-1.5">
                    <span className="text-xs font-mono font-bold text-gray-600">
                      FAQ #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveFaq(idx, 'up')}
                          className="px-2 py-0.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                          title="Move Up"
                        >
                          ↑ Up
                        </button>
                      )}
                      {idx < faqs.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveFaq(idx, 'down')}
                          className="px-2 py-0.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                          title="Move Down"
                        >
                          ↓ Down
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveFaq(idx)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-0.5 hover:bg-red-50 rounded ml-1"
                        title="Remove this question"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Question</label>
                    <input
                      type="text"
                      placeholder="e.g. How fresh are the greens when they arrive?"
                      value={faq.question}
                      onChange={(e) => handleFaqChange(idx, 'question', e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Answer</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Every tray is cut after you place your order..."
                      value={faq.answer}
                      onChange={(e) => handleFaqChange(idx, 'answer', e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 9: SHOP CATALOG LISTING CARD SUBTITLES */}
          {/* ========================================================================= */}
          <div id="sec-catalog-cards" className="bg-amber-50/70 border border-amber-300 rounded-2xl p-6 sm:p-7 shadow-xs">
            <div className="pb-4 mb-6 border-b border-amber-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[11px] font-bold text-amber-950 bg-amber-200 border border-amber-300 px-2 py-0.5 rounded uppercase tracking-wider">
                  Catalog Shop Grid Only (/products)
                </span>
                <h2 className="text-base sm:text-lg font-bold text-amber-950">
                  Shop Catalog Grid Card Subtitles (Highlight 1 &amp; 2)
                </h2>
              </div>
              <p className="text-xs text-amber-900/90 font-medium">
                ⚠️ <strong>Important distinction:</strong> These two short lines appear <u>ONLY</u> on the catalog cards on the main <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950">/products</code> shop grid. They do <u>NOT</u> appear on the individual product detail page hero (Section 2 controls the detail hero).
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-amber-950 mb-1">
                    Catalog Card Subtitle 1 <span className="font-mono text-gray-500 font-normal">(highlight_1)</span>
                  </label>
                  <input
                    value={form.highlight_1}
                    onChange={(e) => setForm({ ...form, highlight_1: e.target.value })}
                    placeholder="e.g. Detox and Digestion"
                    className="w-full px-3.5 py-2.5 border border-amber-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <p className="text-[11px] text-amber-800/80 mt-1">
                    First subtitle line rendered directly beneath the product name on the shop grid card.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-950 mb-1">
                    Catalog Card Subtitle 2 <span className="font-mono text-gray-500 font-normal">(highlight_2)</span>
                  </label>
                  <input
                    value={form.highlight_2}
                    onChange={(e) => setForm({ ...form, highlight_2: e.target.value })}
                    placeholder="e.g. Rich in glucoraphasatin"
                    className="w-full px-3.5 py-2.5 border border-amber-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <p className="text-[11px] text-amber-800/80 mt-1">
                    Second subtitle line rendered in secondary gray font on the shop grid card.
                  </p>
                </div>
              </div>

              {/* Mini Catalog Card Live Preview */}
              <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b">
                    <span className="font-mono text-[10.5px] font-bold text-amber-900 uppercase tracking-wider">
                      Shop Grid Card Preview (/products)
                    </span>
                    <span className="text-[10px] text-gray-400">Card on Shop Page</span>
                  </div>

                  <div className="max-w-[240px] mx-auto bg-[#FFFDF8] border border-[#E4DDC8] rounded-2xl p-3 shadow-xs">
                    <div className="aspect-square bg-stone-100 rounded-xl mb-3 overflow-hidden flex items-center justify-center relative">
                      {form.thumbnail_url ? (
                        <img
                          src={form.thumbnail_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">Product Thumbnail</span>
                      )}
                      {form.badge_label && (
                        <span className="absolute top-2 left-2 bg-[#8B2D46] text-white text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {form.badge_label}
                        </span>
                      )}
                    </div>
                    <h4 className="font-serif font-medium text-base text-[#151F19] truncate">
                      {form.name || 'Pink Radish'}
                    </h4>
                    <p className="text-xs text-emerald-950 font-medium truncate mt-0.5">
                      {form.highlight_1 || 'Detox and Digestion'}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {form.highlight_2 || 'Rich in glucoraphasatin'}
                    </p>
                    <div className="mt-3 pt-2 border-t border-[#E4DDC8]/60 flex items-center justify-between text-xs">
                      <span className="font-bold text-[#122A1F]">
                        {lowestPrice > 0 ? formatPrice(lowestPrice) : 'From ₹150'}
                      </span>
                      <span className="text-[11px] bg-emerald-900 text-white px-2 py-0.5 rounded-md font-semibold">
                        View
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 text-center mt-3">
                  This card is what appears when browsing the main shop catalog.
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 10: SEARCH ENGINE OPTIMIZATION (SEO) */}
          {/* ========================================================================= */}
          <div id="sec-seo" className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 shadow-xs">
            <div className="pb-4 mb-6 border-b">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wider">
                  Search Engines &amp; Social Previews
                </span>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  Search Engine Optimization (SEO)
                </h2>
              </div>
              <p className="text-xs text-gray-500">
                Optional metadata overrides for Google search results and WhatsApp/social sharing cards.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">SEO Title</label>
                  <span className={`text-xs font-mono ${(form.seo_title?.length || 0) > 60 ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
                    {form.seo_title?.length || 0} / 60
                  </span>
                </div>
                <input
                  type="text"
                  value={form.seo_title}
                  onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                  placeholder={form.name ? `${form.name} · Fresh Microgreens` : 'Automatic fallback: Product Name'}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">SEO Meta Description</label>
                  <span className={`text-xs font-mono ${(form.seo_description?.length || 0) > 155 ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
                    {form.seo_description?.length || 0} / 155
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={form.seo_description}
                  onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                  placeholder={form.description || 'Automatic fallback: truncated product description'}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm bg-white leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Fixed Bottom Sticky Save Bar ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 py-3 px-4 sm:px-8 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm text-gray-900 truncate">
                {form.name || 'Untitled Product'}
              </span>
              <span className="text-xs text-gray-400 font-mono hidden sm:inline">
                {form.slug ? `/products/${form.slug}` : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors hidden sm:block"
              >
                ↑ Top
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-gray-900 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : (isNew ? 'Save & Create Product' : 'Save Changes')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredTableProducts =
    categoryFilter === 'all'
      ? products
      : products
          .filter((p) => p.categories?.includes(categoryFilter))
          .sort((a, b) => {
            const ordA = a.category_orders?.[categoryFilter] ?? a.display_order ?? 9999;
            const ordB = b.category_orders?.[categoryFilter] ?? b.display_order ?? 9999;
            return ordA - ordB;
          });

  // ── Product list view ──
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="#category-manager"
            className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-xs sm:text-sm font-semibold rounded-lg hover:bg-gray-50 shrink-0 cursor-pointer shadow-xs transition-colors"
          >
            ↕ Manage Categories &amp; Order
          </a>
          <button
            onClick={() => {
              setIsNew(true);
              setEditing(null);
              setForm(emptyProduct);
              setTagString('');
              setVariants([]);
              setImages([]);
              setBadges(defaultBadges);
              setFaqs(defaultProductFaqs);
              setAccordions(defaultDetailAccordions);
              setPairsWellWith(['', '', '']);
            }}
            className="px-4 py-2 bg-gray-900 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-gray-800 shrink-0 cursor-pointer shadow-xs"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* ── Global Subscription Discount Control Card ── */}
      <div className="mb-6 bg-gradient-to-r from-emerald-50/90 via-[#F7FAF0] to-amber-50/60 border border-emerald-200/90 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
                STOREWIDE SUBSCRIPTION ROUTINE
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Active: {subDiscount}% OFF
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-gray-900">
              Subscription &amp; Save Discount Percentage
            </h2>
            <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
              Applied automatically to the <strong>&ldquo;Subscribe&rdquo;</strong> routine option for all products across the site using the formula:
              <code className="block sm:inline sm:ml-1 mt-1 sm:mt-0 bg-white px-1.5 py-0.5 rounded border border-gray-200 text-emerald-800 text-[11px] font-mono break-all sm:break-normal">
                Base Price &times; Trays &times; Weeks &times; (1 &minus; Discount%)
              </code>.
              Single tray / one-time orders remain at regular standard price.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 bg-white p-2 rounded-lg border border-gray-200 shadow-xs self-start sm:self-auto">
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={subDiscountInput}
                onChange={(e) => setSubDiscountInput(e.target.value)}
                className="w-20 sm:w-24 px-3 py-1.5 text-center font-mono font-bold text-base text-gray-900 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="15"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-bold text-gray-500 pointer-events-none text-sm">
                %
              </span>
            </div>
            <button
              onClick={handleSaveSubDiscount}
              disabled={savingSubDiscount}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all shadow-sm ${
                subDiscountSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#1C3F2D] hover:bg-[#122A1F] text-white'
              } disabled:opacity-50 cursor-pointer`}
            >
              {savingSubDiscount ? 'Saving…' : subDiscountSaved ? '✓ Saved!' : 'Save Discount'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Category Display Order & Visibility Manager Card ── */}
      <div id="category-manager" className="mb-6 bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
                STOREFRONT CATEGORY SEQUENCING &amp; VISIBILITY
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {categoriesList.filter((c) => c.is_active).length} of {categoriesList.length} categories visible on shop
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-gray-900">
              Category Display Order &amp; Visibility on Shop
            </h2>
            <p className="text-xs text-gray-500 max-w-3xl leading-relaxed mt-0.5">
              Choose which category carousels appear on the customer shop page (<code className="text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded font-mono text-[11px]">/products</code>) and specify the exact order they are presented. Toggle to show or hide, click arrows or set numbers, and click &ldquo;Save Category Order&rdquo;.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              onClick={handleSaveCategories}
              disabled={savingCategories || categoriesList.length === 0}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5 ${
                categoriesSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#1C3F2D] hover:bg-[#122A1F] text-white'
              } disabled:opacity-50 cursor-pointer`}
            >
              {savingCategories ? 'Saving…' : categoriesSaved ? '✓ Saved!' : 'Save Category Order'}
            </button>
          </div>
        </div>

        {/* Categories List */}
        {loadingCategories ? (
          <div className="py-8 text-center text-sm text-gray-400">Loading categories…</div>
        ) : categoriesList.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">No categories found. Add your first category below.</div>
        ) : (
          <div className="divide-y divide-gray-100 my-2">
            {categoriesList.map((cat, idx) => {
              const formattedName = cat.name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
              return (
                <div
                  key={cat.name}
                  className={`py-3 px-2 sm:px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg transition-colors ${
                    cat.is_active ? 'hover:bg-gray-50/80' : 'bg-gray-50/60 opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* Left: Reorder controls + Category info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Up / Down arrows */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCategoryMove(idx, 'up')}
                        disabled={idx === 0}
                        title="Move Up in sequence"
                        className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent rounded cursor-pointer"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCategoryMove(idx, 'down')}
                        disabled={idx === categoriesList.length - 1}
                        title="Move Down in sequence"
                        className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent rounded cursor-pointer"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Order # input */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] font-medium text-gray-400">#</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={cat.display_order}
                        onChange={(e) => handleCategoryOrderInput(idx, e.target.value)}
                        className="w-14 px-2 py-1 text-center font-mono font-bold text-xs text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        title="Sequence order number on storefront"
                      />
                    </div>

                    {/* Name + slug */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-gray-900">
                          {formattedName}
                        </span>
                        <span className="font-mono text-[10.5px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {cat.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
                        <span className="font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          {cat.product_count ?? 0} {cat.product_count === 1 ? 'product' : 'products'}
                        </span>
                        {cat.display_order > 0 && (
                          <span className="text-gray-400 font-mono text-[10.5px]">
                            Position #{idx + 1}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Visibility toggle + Delete */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    {/* Visibility toggle switch/button */}
                    <button
                      type="button"
                      onClick={() => handleToggleCategoryVisibility(idx)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                        cat.is_active
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300 border border-gray-300'
                      }`}
                      title={cat.is_active ? 'Click to hide category from shop' : 'Click to show category on shop'}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          cat.is_active ? 'bg-emerald-600' : 'bg-gray-400'
                        }`}
                      />
                      <span>{cat.is_active ? 'Visible on Shop' : 'Hidden from Shop'}</span>
                    </button>

                    {/* Delete category */}
                    <button
                      type="button"
                      onClick={() => handleDeleteCategoryDirect(cat.name, cat.product_count ?? 0)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded text-xs transition-colors cursor-pointer"
                      title="Remove category setting"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom toolbar: Add Category form */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form
            onSubmit={handleAddCategoryDirect}
            className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 max-w-md"
          >
            <input
              type="text"
              value={newCatInput}
              onChange={(e) => setNewCatInput(e.target.value)}
              placeholder="New category name (e.g. Microgreens)"
              className="flex-1 min-w-[180px] px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            />
            <button
              type="submit"
              disabled={addingCat || !newCatInput.trim()}
              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer"
            >
              {addingCat ? 'Adding…' : '+ Add Category'}
            </button>
          </form>

          {categoriesSaved && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 self-center">
              ✓ Category display order and visibility saved!
            </span>
          )}
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0 mr-1">
          Filter:
        </span>
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
            categoryFilter === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Products ({products.length})
        </button>
        {categoriesList.map((cat) => {
          const count = products.filter((p) => p.categories?.includes(cat.name)).length;
          return (
            <button
              key={cat.name}
              onClick={() => setCategoryFilter(cat.name)}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                categoryFilter === cat.name
                  ? 'bg-emerald-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="capitalize">{cat.name.replace(/-/g, ' ')}</span> ({count})
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => loadProducts()}
          disabled={loadingProducts}
          title="Force refresh products list from server"
          className="ml-auto px-3 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <span className={loadingProducts ? 'inline-block animate-spin' : ''}>↻</span>
          <span>{loadingProducts ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto shadow-xs">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b bg-gray-50">
              <th className="px-4 py-3">Thumbnail</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category &amp; Order</th>
              <th className="px-4 py-3">Health Goals</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(categoryFilter === 'all'
              ? products
              : products
                  .filter((p) => p.categories?.includes(categoryFilter))
                  .sort((a, b) => {
                    const ordA = a.category_orders?.[categoryFilter] ?? a.display_order ?? 9999;
                    const ordB = b.category_orders?.[categoryFilter] ?? b.display_order ?? 9999;
                    return ordA - ordB;
                  })
            ).map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  {p.thumbnail_url ? (
                    <img
                      src={p.thumbnail_url}
                      alt={p.name}
                      className="w-10 h-10 object-cover rounded-lg border bg-white"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-400 border">
                      <Sprout className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-gray-700">
                  <div className="flex flex-col gap-1">
                    {(p.categories || []).map((c) => {
                      const ord = p.category_orders?.[c];
                      return (
                        <div key={c} className="flex items-center gap-1.5 text-xs">
                          <span className="capitalize font-medium">{c.replace(/-/g, ' ')}</span>
                          <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-200" title={`Order ${ord} in ${c}`}>
                            #{ord !== undefined && ord !== null ? ord : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {p.health_goals && p.health_goals.length > 0 ? (
                      p.health_goals.map((gId) => {
                        const gDef = HEALTH_GOALS.find(
                          (g) => g.id === gId || g.slug === gId || g.aliases.includes(gId)
                        );
                        return (
                          <span
                            key={gId}
                            className="text-[9.5px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1"
                          >
                            <Target className="w-2.5 h-2.5 text-emerald-700 inline" />
                            <span>{gDef?.title || gId}</span>
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-gray-400 italic">None</span>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleToggleProductStatus(p.id, p.is_active)}
                    disabled={togglingId === p.id}
                    title={p.is_active ? 'Click to deactivate product' : 'Click to activate product'}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                      p.is_active
                        ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p.is_active ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    <span>{togglingId === p.id ? 'Updating...' : p.is_active ? 'Active' : 'Inactive'}</span>
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => loadProduct(p.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTableProducts.length === 0 && (
          <p className="p-6 text-center text-gray-400">
            {categoryFilter === 'all'
              ? 'No products yet'
              : `No products found under category "${categoryFilter}"`}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Helper to extract weight in grams from variant label ──
function extractWeightFromLabel(label: string): number | null {
  if (!label) return null;
  const kgMatch = label.match(/(\d+(?:\.\d+)?)\s*kg\b/i);
  if (kgMatch) {
    const kg = parseFloat(kgMatch[1]);
    if (!isNaN(kg)) return Math.round(kg * 1000);
  }
  const gMatch = label.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|gram|grams)\b/i);
  if (gMatch) {
    const g = parseFloat(gMatch[1]);
    if (!isNaN(g)) return Math.round(g);
  }
  return null;
}

// ── Inline variant editor row ──
function VariantRow({
  variant,
  onSave,
  onDelete,
}: {
  variant: Variant;
  onSave: (v: Variant) => void;
  onDelete: (id: string) => void;
}) {
  const [v, setV] = useState(variant);

  useEffect(() => {
    setV(variant);
  }, [variant]);

  const changed =
    v.label !== variant.label ||
    v.net_weight_grams !== variant.net_weight_grams ||
    v.price_paise !== variant.price_paise ||
    v.stock_qty !== variant.stock_qty ||
    v.is_active !== variant.is_active;

  const handleLabelChange = (newLabel: string) => {
    const extracted = extractWeightFromLabel(newLabel);
    setV((prev) => ({
      ...prev,
      label: newLabel,
      ...(extracted !== null ? { net_weight_grams: extracted } : {}),
    }));
  };

  return (
    <tr className="border-b last:border-0">
      <td className="py-2">
        <input
          value={v.label}
          onChange={(e) => handleLabelChange(e.target.value)}
          className="px-2 py-1 border rounded text-sm w-full"
        />
      </td>
      <td className="py-2">
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={v.net_weight_grams ?? ''}
            onChange={(e) => setV({ ...v, net_weight_grams: Number(e.target.value) })}
            className="px-2 py-1 border rounded text-sm w-16"
          />
          <span className="text-gray-500 text-xs">g</span>
        </div>
      </td>
      <td className="py-2">
        <input
          type="number"
          value={v.price_paise}
          onChange={(e) => setV({ ...v, price_paise: Number(e.target.value) })}
          className="px-2 py-1 border rounded text-sm w-20"
        />{' '}
        <span className="text-gray-400 text-xs">({formatPrice(v.price_paise)})</span>
      </td>
      <td className="py-2">
        <input
          type="number"
          value={v.stock_qty}
          onChange={(e) => setV({ ...v, stock_qty: Number(e.target.value) })}
          className="px-2 py-1 border rounded text-sm w-16"
        />
      </td>
      <td className="py-2">
        <input
          type="checkbox"
          checked={v.is_active}
          onChange={(e) => setV({ ...v, is_active: e.target.checked })}
        />
      </td>
      <td className="py-2 space-x-2">
        {changed && (
          <button onClick={() => onSave(v)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold">
            Save
          </button>
        )}
        <button onClick={() => onDelete(v.id)} className="text-red-500 hover:text-red-700 text-xs">
          Delete
        </button>
      </td>
    </tr>
  );
}
