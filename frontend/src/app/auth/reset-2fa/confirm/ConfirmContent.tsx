'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const confirmReset = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setError('Missing reset token.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/api/auth/2fa/reset-confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (res.ok) {
          setSuccess(true);
        } else {
          setError(data.message || 'Verification failed.');
        }
      } catch (err) {
        setError('Failed to connect to server.');
      } finally {
        setLoading(false);
      }
    };

    confirmReset();
  }, [searchParams]);

  return (
    <div className="w-full max-w-md bg-background dark:bg-gray-900 rounded-xl shadow-high p-lg border border-gray-100 dark:border-gray-800 text-center">
      <div className="mb-lg">
        <h2 className="text-2xl font-bold text-foreground dark:text-white">Resetting 2FA PIN</h2>
      </div>

      {loading && (
        <div className="space-y-md">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500">Verifying your recovery link...</p>
        </div>
      )}

      {error && (
        <div className="space-y-md">
          <div className="p-sm rounded-m bg-red-50 dark:bg-red-900/20 text-red-600 text-sm font-medium border border-red-100 dark:border-red-900/30">
            {error}
          </div>
          <Link href="/auth/forgot-2fa" className="block text-primary font-bold hover:underline">Request new link</Link>
        </div>
      )}

      {success && (
        <div className="space-y-md">
          <div className="p-sm rounded-m bg-green-50 dark:bg-green-900/20 text-green-600 text-sm font-medium border border-green-100 dark:border-green-900/30">
            Two-factor authentication (PIN) has been disabled successfully.
          </div>
          <p className="text-sm text-gray-500">You can now sign in with your password and setup a new PIN.</p>
          <Link href="/login" className="btn-primary inline-block w-full">Go to Login</Link>
        </div>
      )}
    </div>
  );
}
