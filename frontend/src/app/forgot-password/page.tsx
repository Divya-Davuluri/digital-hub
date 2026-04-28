'use client';

import Link from 'next/link';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [devToken, setDevToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      setMessage({ type: 'success', text: 'Reset link sent! Please check your email (or see token below in dev mode).' });
      setDevToken(data.token);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
        <div className="absolute top-1/4 left-1/4 w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-[440px] card p-10">
        <div className="text-center mb-10">
          <Link href="/login" className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Login
          </Link>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Forgot Password?</h2>
          <p className="text-text-muted mt-2 text-sm">Enter your email and we&apos;ll send you a link to reset your password.</p>
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

        {devToken && (
          <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
             <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Dev Mode: Reset Link</p>
             <Link href={`/reset-password?token=${devToken}`} className="text-xs text-text break-all hover:underline font-medium">
               http://localhost:3000/reset-password?token={devToken}
             </Link>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest pl-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="name@agency.com"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </main>
  );
}
