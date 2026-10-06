'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useAdminAuth } from '@/lib/adminAuth';
import { LeafFavicon } from '@/components/icons';

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

  const navItems = [
    { href: `/${currentKey}`, label: 'Dashboard', icon: '📊' },
    { href: `/${currentKey}/products`, label: 'Products', icon: '🌱' },
    { href: `/${currentKey}/health-goals`, label: 'Health Goal Content', icon: '🎯' },
    { href: `/${currentKey}/orders`, label: 'Orders', icon: '📦' },
    { href: `/${currentKey}/newsletter`, label: 'Newsletter', icon: '📬' },
    { href: `/${currentKey}/inquiries`, label: 'Inquiries', icon: '📩' },
    { href: `/${currentKey}/reviews`, label: 'Reviews', icon: '⭐' },
    { href: `/${currentKey}/content`, label: 'Content', icon: '✏️' },
    { href: `/${currentKey}/email-content`, label: 'Email Content', icon: '✉️' },
    { href: `/${currentKey}/partner-logos`, label: 'Partner Logos', icon: '🏢' },
    { href: `/${currentKey}/pins`, label: 'Pins', icon: '📌' },
    { href: `/${currentKey}/blog`, label: 'Pathshala & Recipes', icon: '📝' },
  ];

  // Login page: no sidebar, no auth check blocking
  if (pathname === `/${currentKey}/login` || pathname.endsWith('/login')) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthed) return null;

  const handleLogout = () => {
    document.cookie = 'admin_token=; path=/; max-age=0';
    router.push(`/${currentKey}/login`);
  };

  return (
    <div className="min-h-screen flex bg-gray-50 admin-panel-root">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-800 bg-gray-950/40">
          <Link href={`/${currentKey}`} className="flex flex-col gap-1.5 group block" title="Wild About Greens Admin Panel">
            <Image
              src="/logo-picture-bg.png"
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
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === `/${currentKey}`
                ? pathname === `/${currentKey}`
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-700 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <span>🌐</span> View Site
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 w-full text-left"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
