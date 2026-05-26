'use client';
import { useEffect } from 'react';

export default function DashboardError({
  error, reset
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard Error]:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center max-w-md">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="text-xl font-black text-slate-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
