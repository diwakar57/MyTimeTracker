'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';

export default function Navbar() {
  const pathname = usePathname();
  const { allowOverlap, setAllowOverlap } = useStore();

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
        </div>
      </div>
    </nav>
  );
}
