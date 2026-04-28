'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Request2FAReset() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/2fa/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
      } else {
        setError(data.message || 'Something went wrong');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface dark:bg-black px-lg">
      <div className="w-full max-w-md bg-background dark:bg-gray-900 rounded-xl shadow-high p-lg border border-gray-100 dark:border-gray-800">
        <div className="text-center mb-lg">
          <h2 className="text-2xl font-bold text-foreground dark:text-white">Reset 2FA PIN</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-xs">
            Enter your email to receive a secure link to reset your 2FA PIN.
          </p>
        </div>

        {error && (
          <div className="mb-md p-sm rounded-m bg-red-50 dark:bg-red-900/20 text-red-600 text-sm font-medium border border-red-100 dark:border-red-900/30">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-md p-sm rounded-m bg-green-50 dark:bg-green-900/20 text-green-600 text-sm font-medium border border-green-100 dark:border-green-900/30">
            {message}
          </div>
        )}

        {!message ? (
          <form className="space-y-md" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-xs">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-md py-md rounded-m border border-gray-200 dark:border-gray-800 bg-transparent focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="admin@agency.com"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="text-center mt-md">
            <Link href="/login" className="text-primary font-bold hover:underline">Back to Login</Link>
          </div>
        )}
      </div>
    </main>
  );
}
