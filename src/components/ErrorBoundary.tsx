'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (error) {
      const isFirebaseConfig =
        error.message.includes('Firebase configuration is incomplete') ||
        error.message.includes('auth/invalid-api-key') ||
        error.message.includes('invalid-api-key');

      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-gray-900 rounded-2xl p-8 border border-red-500/30 shadow-xl">
            <h1 className="text-2xl font-bold text-red-400 mb-3">
              {isFirebaseConfig ? 'Firebase Configuration Missing' : 'Something went wrong'}
            </h1>
            {isFirebaseConfig ? (
              <>
                <p className="text-gray-300 mb-4">
                  The app could not start because Firebase environment variables are not configured.
                </p>
                <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside mb-4">
                  <li>
                    Go to your{' '}
                    <a
                      href="https://console.firebase.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline"
                    >
                      Firebase project settings
                    </a>{' '}
                    and copy your web app credentials.
                  </li>
                  <li>
                    For <strong>local development</strong>: copy{' '}
                    <code className="bg-gray-800 px-1 rounded">.env.local.example</code> to{' '}
                    <code className="bg-gray-800 px-1 rounded">.env.local</code> and fill in the
                    values.
                  </li>
                  <li>
                    For <strong>Vercel deployment</strong>: add the{' '}
                    <code className="bg-gray-800 px-1 rounded">NEXT_PUBLIC_FIREBASE_*</code>{' '}
                    variables in your Vercel project&apos;s{' '}
                    <strong>Settings → Environment Variables</strong>.
                  </li>
                </ol>
                <p className="text-gray-500 text-xs">
                  See the README for the full list of required variables.
                </p>
              </>
            ) : (
              <p className="text-gray-400 text-sm break-words">{error.message}</p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
