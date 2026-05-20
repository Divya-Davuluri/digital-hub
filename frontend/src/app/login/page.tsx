'use client';

import Link from "next/link";
import { useState } from "react";
import apiCall from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/context/BrandingContext";

export default function LoginPage() {
  const { login } = useAuth();
  const { branding } = useBranding();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = showOTP ? "/auth/2fa/validate" : "/auth/login";
      const body = showOTP ? { userId, token: otp } : { email, password };

      const data = await apiCall(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (data.status === "2FA_REQUIRED") {
        setShowOTP(true);
        setUserId(data.userId);
      } else {
        // Use the centralized login function
        login(data);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const layout = branding?.loginPageBranding || 'center';
  const primaryColor = branding?.primaryColor || '#6366f1';
  const agencyName = branding?.agencyName || 'HubSaaS';

  const formSection = (
    <div className={`w-full max-w-[440px] ${
      layout === 'simple'
        ? 'bg-transparent text-slate-900'
        : 'bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl text-white'
    }`}>
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-3 mb-6">
          {branding?.logoUrl ? (
            <img src={branding.logoUrl} alt={agencyName} className="h-10 object-contain max-w-[200px]" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: primaryColor }}>
                <div className="w-5 h-5 bg-white rounded-sm rotate-45" />
              </div>
              <span className={`text-2xl font-bold tracking-tight ${layout === 'simple' ? 'text-slate-900' : 'text-white'}`}>
                {agencyName}
              </span>
            </>
          )}
        </Link>
        <h2 className={`text-3xl font-bold tracking-tight ${layout === 'simple' ? 'text-slate-900' : 'text-white'}`}>
          {showOTP ? "Security Check" : "Sign In"}
        </h2>
        <p className={`mt-2 text-sm ${layout === 'simple' ? 'text-slate-500' : 'text-slate-400'}`}>
          {showOTP ? "Enter the 6-digit verification code" : "Manage your agency campaigns"}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 animate-shake">
          ⚠️ {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        {!showOTP ? (
          <>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-xl px-4 py-3.5 outline-none transition-all ${
                  layout === 'simple'
                    ? 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-slate-400'
                    : 'bg-slate-800/50 border border-white/10 text-white focus:border-indigo-500 placeholder:text-slate-600'
                }`}
                placeholder="admin@demo.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center pl-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-xl px-4 py-3.5 outline-none transition-all ${
                  layout === 'simple'
                    ? 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-slate-400'
                    : 'bg-slate-800/50 border border-white/10 text-white focus:border-indigo-500 placeholder:text-slate-600'
                }`}
                placeholder="••••••••"
              />
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Verification Code</label>
            <input 
              type="text" 
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={`w-full rounded-xl px-4 py-5 outline-none text-center text-2xl tracking-[0.2em] font-bold transition-all ${
                layout === 'simple'
                  ? 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-slate-400'
                  : 'bg-slate-800/50 border border-white/10 text-white focus:border-indigo-500'
              }`}
              placeholder="000000"
            />
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-lg disabled:opacity-50"
          style={{ 
            backgroundColor: primaryColor,
            boxShadow: `0 10px 15px -3px ${primaryColor}44`
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Authenticating...</span>
            </div>
          ) : (showOTP ? "Verify" : "Sign In")}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className={`text-sm ${layout === 'simple' ? 'text-slate-500' : 'text-slate-400'}`}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-bold hover:underline" style={{ color: primaryColor }}>Create Account</Link>
        </p>
      </div>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className={`w-full border-t ${layout === 'simple' ? 'border-slate-100' : 'border-white/5'}`}></div>
        </div>
        <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <span className={`px-4 ${layout === 'simple' ? 'bg-white' : 'bg-slate-900/50'}`}>Social Login</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button className={`font-bold py-3 rounded-xl border transition-all text-sm flex items-center justify-center gap-2 ${
          layout === 'simple'
            ? 'bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200'
            : 'bg-slate-800/50 hover:bg-slate-800 text-white border-white/5'
        }`}>
           Google
        </button>
        <button className={`font-bold py-3 rounded-xl border transition-all text-sm flex items-center justify-center gap-2 ${
          layout === 'simple'
            ? 'bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200'
            : 'bg-slate-800/50 hover:bg-slate-800 text-white border-white/5'
        }`}>
           Facebook
        </button>
      </div>
    </div>
  );

  if (layout === 'split') {
    return (
      <main className="min-h-screen flex bg-slate-950">
        <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12 bg-slate-900">
          {formSection}
        </div>
        <div className="hidden md:flex md:w-1/2 relative items-center justify-center overflow-hidden p-12" style={{ backgroundColor: primaryColor }}>
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent z-10" />
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-black/10 rounded-full blur-3xl" />
          <div className="relative z-20 text-center text-white max-w-md">
            <h2 className="text-4xl font-black mb-4 leading-tight">{agencyName} Workspace</h2>
            <p className="text-white/80 text-sm leading-relaxed">
              Experience dynamic marketing automation, customized social schedulers, contact management, and real-time dashboard analytics.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (layout === 'simple') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-6">
        {formSection}
      </main>
    );
  }

  // Default Center Layout
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0F172A] px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
        <div className="absolute top-1/4 left-1/4 w-[60%] h-[60%] blur-[120px] rounded-full" style={{ backgroundColor: `${primaryColor}1a` }} />
        <div className="absolute bottom-1/4 right-1/4 w-[60%] h-[60%] blur-[120px] rounded-full" style={{ backgroundColor: `${primaryColor}1a` }} />
      </div>
      {formSection}
    </main>
  );
}
