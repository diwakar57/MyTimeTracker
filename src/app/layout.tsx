import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/components/AuthProvider';
import AppShell from '@/components/AppShell';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'MyTimeTracker',
  description: 'Track time across multiple activities',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-gray-950 min-h-screen">
        <ErrorBoundary>
          <AuthProvider>
            <AppShell>
              <Navbar />
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </main>
            </AppShell>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
