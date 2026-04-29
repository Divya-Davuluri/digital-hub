'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const refreshToken = params.get("refreshToken");
      const userParam = params.get("user");
      const errorParam = params.get("error");
      const twoFactorRequired = params.get("2fa_required");
      const urlUserId = params.get("userId");

      if (token && refreshToken) {
        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);
        if (userParam) {
          localStorage.setItem("user", decodeURIComponent(userParam));
        }
        router.push("/dashboard");
      }

      if (twoFactorRequired === "true" && urlUserId) {
        setUserId(urlUserId);
        setShowOTP(true);
      }

      if (errorParam === "oauth_failed") {
        setError("Social login failed. Please try again.");
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.clear(); // Clear any stale sessions/tokens before login
    setLoading(true);
    setError("");

    try {
      const endpoint = showOTP ? "/auth/2fa/validate" : "/auth/login";
      const body = showOTP ? { userId, token: otp } : { email, password };

      const data = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (data.status === "2FA_REQUIRED") {
        setShowOTP(true);
        setUserId(data.userId);
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Dynamic redirection based on role
        if (data.user.role === 'admin') {
          router.push("/dashboard/admin");
        } else {
          router.push("/dashboard/team");
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0F172A] px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
        <div className="absolute top-1/4 left-1/4 w-[60%] h-[60%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[60%] h-[60%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-[440px] bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-5 h-5 bg-white rounded-sm rotate-45" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Hub<span className="text-indigo-500">SaaS</span></span>
          </Link>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {showOTP ? "Security Check" : "Sign In"}
          </h2>
          <p className="text-slate-400 mt-2 text-sm">
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
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-indigo-500 transition-all"
                  placeholder="admin@demo.com"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center pl-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
                  <Link href="/forgot-password" hidden className="text-[11px] text-indigo-400 font-bold hover:text-indigo-300 uppercase">Forgot?</Link>
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-indigo-500 transition-all"
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
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-5 text-white outline-none focus:border-indigo-500 text-center text-2xl tracking-[0.2em] font-bold transition-all"
                placeholder="000000"
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : (showOTP ? "Verify" : "Sign In")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-indigo-400 font-bold hover:text-indigo-300">Create Account</Link>
          </p>
        </div>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <span className="px-4 bg-[#1e293b]/50 backdrop-blur-sm">Social Login</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => window.location.href = `${apiUrl}/auth/google`} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-white/5 transition-all text-sm">Google</button>
          <button onClick={() => window.location.href = `${apiUrl}/auth/facebook`} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-white/5 transition-all text-sm">Facebook</button>
        </div>
      </div>
    </main>
  );
}
