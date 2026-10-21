'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useAdminAuth } from '@/lib/adminAuth';
import {
  LeafFavicon,
  BarChart,
  Sprout,
  Target,
  PackageBox,
  Clipboard,
  Truck,
  Mail,
  Tag,
  Inbox,
  Star,
  Edit3,
  FileText,
  Building,
  Pin,
  BookOpen,
  Globe,
  LogOut,
  Menu,
  X,
} from '@/components/icons';
import { CLOUDINARY_ASSETS } from '@/lib/publicImages';

export default function AdminLayoutClient({
  children,
  panelKey,
}: {
  children: React.ReactNode;
  panelKey?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const currentKey = (params?.panelKey as string) || panelKey || 'admin';
  const { isAuthed, loading } = useAdminAuth(currentKey);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.title = 'Wild About Greens Admin Panel';
    const updateFavicon = () => {
      let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = '/favicon.ico';
    };
    updateFavicon();
  }, []);

  // Automatically close mobile menu whenever navigation occurs
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { href: `/${currentKey}`, label: 'Dashboard', icon: BarChart },
    { href: `/${currentKey}/products`, label: 'Products', icon: Sprout },
    { href: `/${currentKey}/health-goals`, label: 'Health Goal Content', icon: Target },
    { href: `/${currentKey}/orders`, label: 'Orders', icon: PackageBox },
    { href: `/${currentKey}/bulk-orders`, label: 'Bulk Orders Request', icon: Clipboard },
    { href: `/${currentKey}/delivery-pincodes`, label: 'Free Delivery Pincodes', icon: Truck },
    { href: `/${currentKey}/newsletter`, label: 'Newsletter', icon: Mail },
    { href: `/${currentKey}/coupons`, label: 'Coupons', icon: Tag },
    { href: `/${currentKey}/inquiries`, label: 'Inquiries', icon: Inbox },
    { href: `/${currentKey}/reviews`, label: 'Reviews', icon: Star },
    { href: `/${currentKey}/content`, label: 'Content', icon: Edit3 },
    { href: `/${currentKey}/email-content`, label: 'Email Content', icon: FileText },
    { href: `/${currentKey}/partner-logos`, label: 'Partner Logos', icon: Building },
    { href: `/${currentKey}/pins`, label: 'Pins', icon: Pin },
    { href: `/${currentKey}/blog`, label: 'Pathshala & Recipes', icon: BookOpen },
  ];

  // Find active label for mobile header
  const activeNavItem = navItems.find((item) =>
    item.href === `/${currentKey}`
      ? pathname === `/${currentKey}`
      : pathname.startsWith(item.href)
  );

  // Login page: no sidebar, no auth check blocking
  if (pathname === `/${currentKey}/login` || pathname.endsWith('/login')) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">Loading...</p>
      </div>
    );
  }

  if (!isAuthed) return null;

  const handleLogout = () => {
    document.cookie = 'admin_token=; path=/; max-age=0';
    router.push(`/${currentKey}/login`);
  };

  const renderNavLinks = (onItemClick?: () => void) => (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {navItems.map((item) => {
        const isActive =
          item.href === `/${currentKey}`
            ? pathname === `/${currentKey}`
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-emerald-800 text-white shadow-xs font-semibold'
                : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 admin-panel-root">
      {/* ── Desktop Sidebar (Hidden on mobile / tablet, visible on lg) ── */}
      <aside className="hidden lg:flex lg:w-64 bg-gray-900 text-white flex-col shrink-0 min-h-screen sticky top-0 h-screen">
        <div className="p-4 border-b border-gray-800 bg-gray-950/40 shrink-0">
          <Link
            href={`/${currentKey}`}
            className="flex flex-col gap-1.5 group block"
            title="Wild About Greens Admin Panel"
          >
            <Image
              src={CLOUDINARY_ASSETS.logoPictureBg}
              alt="Wild About Greens"
              width={160}
              height={36}
              className="h-8 w-auto object-contain brightness-105"
              priority
            />
            <div className="flex items-center gap-1.5 pl-0.5">
              <LeafFavicon className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold text-emerald-400 tracking-wider uppercase">
                Admin Panel
              </span>
            </div>
          </Link>
        </div>

        {renderNavLinks()}

        <div className="p-3 border-t border-gray-800 space-y-1 shrink-0 bg-gray-950/20">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>View Site</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 w-full text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Drawer Overlay & Slide-out Sidebar ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-gray-900 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        <div className="p-4 border-b border-gray-800 bg-gray-950/40 flex items-center justify-between shrink-0">
          <Link
            href={`/${currentKey}`}
            onClick={() => setMobileMenuOpen(false)}
            className="flex flex-col gap-1"
          >
            <Image
              src={CLOUDINARY_ASSETS.logoPictureBg}
              alt="Wild About Greens"
              width={140}
              height={30}
              className="h-7 w-auto object-contain brightness-105"
            />
            <div className="flex items-center gap-1.5 pl-0.5">
              <LeafFavicon className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold text-emerald-400 tracking-wider uppercase">
                Admin Panel
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            className="p-2 -mr-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {renderNavLinks(() => setMobileMenuOpen(false))}

        <div className="p-3 border-t border-gray-800 space-y-1 shrink-0 bg-gray-950/20">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>View Site</span>
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 w-full text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Column with Mobile Topbar ── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* ── Mobile Top Sticky Bar (Uses nav instead of header to bypass public layout CSS rules) ── */}
        <nav
          aria-label="Mobile Admin Header"
          className="admin-mobile-topbar lg:hidden sticky top-0 z-30 bg-gray-900 border-b border-gray-800 text-white px-3.5 py-2.5 flex items-center justify-between shadow-md"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="p-2 -ml-1 rounded-lg bg-gray-800 text-emerald-400 border border-gray-700 hover:bg-gray-700 active:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer flex items-center justify-center shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href={`/${currentKey}`} className="flex items-center gap-1.5 min-w-0">
              <Image
                src={CLOUDINARY_ASSETS.logoPictureBg}
                alt="Wild About Greens"
                width={95}
                height={22}
                className="h-5 w-auto object-contain brightness-105 shrink-0"
                priority
              />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60 shrink-0">
                Admin
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeNavItem && (
              <span className="text-xs text-gray-200 font-medium px-2 py-1 rounded bg-gray-800/90 border border-gray-700 max-w-[120px] truncate hidden sm:inline-block">
                {activeNavItem.label}
              </span>
            )}
            <Link
              href="/"
              title="View Site"
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <Globe className="w-4 h-4" />
            </Link>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-900/50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </nav>

        {/* ── Page Content ── */}
        <main className="flex-1 min-w-0">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
