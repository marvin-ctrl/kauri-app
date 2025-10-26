'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console (in production, send to error tracking service)
    console.error('Application error:', error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <div className="max-w-md w-full bg-white border border-neutral-200 rounded-xl shadow-sm p-8 text-center space-y-4">
        <div className="text-6xl">⚠️</div>
        <h2 className="text-2xl font-bold text-neutral-900">Something went wrong!</h2>
        <p className="text-neutral-600">
          We encountered an unexpected error. Please try again.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left mt-4 p-4 bg-neutral-100 rounded-lg">
            <summary className="cursor-pointer font-semibold text-sm">Error details</summary>
            <pre className="text-xs mt-2 overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
        <div className="flex gap-3 justify-center pt-4">
          <button
            onClick={reset}
            className="px-4 py-2 bg-[#172F56] hover:bg-[#1e3a5f] text-white rounded-lg font-semibold transition-colors"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-900 rounded-lg font-semibold transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
