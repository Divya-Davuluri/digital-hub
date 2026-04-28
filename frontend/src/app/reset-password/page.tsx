'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setMessage({ type: 'error', text: 'Passwords do not match' });
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });

      setMessage({ type: 'success', text: 'Password reset successful! Redirecting to login...' });
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] card p-10">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Set New Password</h2>
        <p className="text-text-muted mt-2 text-sm">Create a strong password to secure your account.</p>
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

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-muted uppercase tracking-widest pl-1">New Password</label>
          <input 
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-muted uppercase tracking-widest pl-1">Confirm Password</label>
          <input 
            type="password" 
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field"
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || !token}
          className="btn-primary w-full"
        >
          {loading ? "Updating..." : "Reset Password"}
        </button>
      </form>
      
      {!token && (
        <p className="mt-6 text-center text-xs text-red-400 font-bold">
          Invalid request. No reset token found in URL.
        </p>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
        <div className="absolute top-1/4 right-1/4 w-[60%] h-[60%] bg-secondary/10 blur-[120px] rounded-full" />
      </div>
      
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
