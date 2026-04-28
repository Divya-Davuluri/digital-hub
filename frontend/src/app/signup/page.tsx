'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setMessage({ type: 'success', text: 'Account created! Redirecting...' });
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Signup failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
        <div className="absolute top-1/4 right-1/4 w-[60%] h-[60%] bg-secondary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 left-1/4 w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-[440px] card p-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
            </div>
            <span className="text-2xl font-bold tracking-tight">DMH<span className="text-primary">Hub</span></span>
          </Link>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Account</h2>
          <p className="text-text-muted mt-2 text-sm">Join the platform for modern agencies</p>
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

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest pl-1">Full Name</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="Agency or Your Name"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest pl-1">Email</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field"
              placeholder="name@agency.com"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest pl-1">Password</label>
            <input 
              type="password" 
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Creating..." : "Get Started"}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest text-text-muted">
            <span className="px-4 bg-background/50 backdrop-blur-sm">Social Register</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <button onClick={() => window.location.href = "http://localhost:5000/api/auth/google"} className="btn-secondary text-sm">Google</button>
           <button onClick={() => window.location.href = "http://localhost:5000/api/auth/facebook"} className="btn-secondary text-sm">Facebook</button>
        </div>

        <p className="mt-10 text-center text-sm text-text-muted font-medium">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-bold hover:text-primary-light">Sign In</Link>
        </p>
      </div>
    </main>
  );
}
