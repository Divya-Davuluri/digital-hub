'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiCall from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    localStorage.clear(); // Ensure clean state for new registration
    try {
      await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setMessage({ type: 'success', text: 'Account created successfully! Redirecting to login...' });
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Signup failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0F172A] px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
        <div className="absolute top-1/4 right-1/4 w-[60%] h-[60%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 left-1/4 w-[60%] h-[60%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-[440px] bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <div className="w-5 h-5 bg-white rounded-sm rotate-45" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Hub<span className="text-indigo-500">SaaS</span></span>
          </Link>
          <h2 className="text-3xl font-bold text-white tracking-tight">Create Account</h2>
          <p className="text-slate-400 mt-2 text-sm">Join the leading platform for modern agencies</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl text-xs font-bold border transition-all ${
            message.type === 'success' 
              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
              : 'bg-red-500/10 text-red-400 border-red-500/20 animate-shake'
          }`}>
            {message.type === 'success' ? '✅' : '⚠️'} {message.text}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-indigo-500 transition-all"
              placeholder="Agency or Your Name"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-indigo-500 transition-all"
              placeholder="name@agency.com"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Password</label>
            <input 
              type="password" 
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-indigo-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {loading ? "Creating Workspace..." : "Get Started Now"}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <span className="px-4 bg-[#1e293b]/50 backdrop-blur-sm">Social Register</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <button onClick={() => window.location.href = `${apiUrl}/api/auth/google`} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-white/5 transition-all text-sm">Google</button>
           <button onClick={() => window.location.href = `${apiUrl}/api/auth/facebook`} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-white/5 transition-all text-sm">Facebook</button>
        </div>

        <p className="mt-10 text-center text-sm text-slate-400 font-medium">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 font-bold hover:text-indigo-300">Sign In</Link>
        </p>
      </div>
    </main>
  );
}
