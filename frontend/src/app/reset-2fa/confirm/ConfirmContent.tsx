'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) setToken(t);
  }, [searchParams]);

  const handleConfirm = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await apiFetch('/auth/forgot-2fa-confirm', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      setIsSuccess(true);
      setMessage({ type: 'success', text: '2FA has been disabled. You can now login with just your password.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] card p-10 text-center">
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Confirm 2FA Removal</h2>
        <p className="text-text-muted mt-2 text-sm">Are you sure you want to disable Two-Factor Authentication for your account?</p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl text-xs font-bold border ${
          message.type === 'success' 
            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {message.text}
        </div>
      )}

      {!isSuccess ? (
        <div className="space-y-4">
          <button 
            onClick={handleConfirm}
            disabled={loading || !token}
            className="btn-primary w-full bg-red-500 hover:bg-red-600 shadow-red-500/20"
          >
            {loading ? "Processing..." : "Yes, Disable 2FA"}
          </button>
          
          {!token && (
            <p className="text-xs text-red-400 font-bold">
              Invalid request. No reset token found in URL.
            </p>
          )}
        </div>
      ) : (
        <Link href="/login" className="btn-primary w-full inline-block">
          Go to Login
        </Link>
      )}
    </div>
  );
}
