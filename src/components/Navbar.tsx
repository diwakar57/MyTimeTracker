'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/components/AuthProvider';
import { signOut } from '@/lib/auth';

export default function Navbar() {
  const pathname = usePathname();
  const { allowOverlap, setAllowOverlap, setStoreData } = useStore();
  const { user } = useAuth();

  const handleSignOut = async () => {
    setStoreData({
      activities: [],
      sessions: [],
      timers: {},
      allowOverlap: false,
    });
    await signOut();
  };

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/charts', label: 'Charts' },
  ];

  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold text-indigo-400">⏱ MyTimeTracker</span>
            <div className="flex gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-sm text-gray-300">Overlap</span>
              <div
                onClick={() => setAllowOverlap(!allowOverlap)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  allowOverlap ? 'bg-indigo-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    allowOverlap ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </div>
            </label>
            {user && (
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt={user.displayName ?? 'User'}
                    className="w-8 h-8 rounded-full border border-gray-600"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
                    {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
