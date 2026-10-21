'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { LeafFavicon } from '@/components/icons';
import { CLOUDINARY_ASSETS } from '@/lib/publicImages';

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useParams();
  const panelKey = (params?.panelKey as string) || 'admin';

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include',
      });

      if (res.ok) {
        router.push(`/${panelKey}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid password');
      }
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8">
        <div className="text-center mb-6 flex flex-col items-center">
          <Image
            src={CLOUDINARY_ASSETS.logoWhiteBg}
            alt="Wild About Greens"
            width={180}
            height={42}
            className="h-10 w-auto object-contain mb-3"
            priority
          />
          <div className="flex items-center justify-center gap-2 mb-1">
            <LeafFavicon className="w-4 h-4" />
            <h1 className="text-lg font-bold text-gray-900">Wild About Greens Admin Panel</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">Enter your admin password</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
