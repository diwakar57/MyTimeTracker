'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/components/AuthProvider';
import LoginPage from '@/components/LoginPage';
import FirebaseSync from '@/components/FirebaseSync';

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-indigo-400 text-lg font-medium animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <>
      <FirebaseSync />
      {children}
    </>
  );
}
