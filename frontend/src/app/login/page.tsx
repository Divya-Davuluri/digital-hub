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
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
        <div className="absolute top-1/4 left-1/4 w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[60%] h-[60%] bg-secondary/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-[440px] card p-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
            </div>
            <span className="text-2xl font-bold tracking-tight">DMH<span className="text-primary">Hub</span></span>
          </Link>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {showOTP ? "Security Check" : "Sign In"}
          </h2>
          <p className="text-text-muted mt-2 text-sm">
            {showOTP ? "Enter the 6-digit code or a backup code" : "Manage your agency campaigns"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {!showOTP ? (
            <>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-muted uppercase tracking-widest pl-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="name@agency.com"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center pl-1">
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest">Password</label>
                  <Link href="/forgot-password" className="text-[11px] text-primary font-bold hover:text-primary-light uppercase">Forgot?</Link>
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-text-muted uppercase tracking-widest text-center">Verification or Backup Code</label>
              <input 
                type="text" 
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="input-field text-center text-2xl tracking-[0.2em] font-bold py-4"
                placeholder="000000"
              />
              <div className="text-center pt-2">
                <Link href="/reset-2fa" className="text-[10px] text-primary font-bold hover:text-primary-light uppercase tracking-widest">Lost 2FA Access?</Link>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Please wait..." : (showOTP ? "Verify" : "Sign In")}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest text-text-muted">
            <span className="px-4 bg-background/50 backdrop-blur-sm">Social Login</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => window.location.href = "http://localhost:5000/api/auth/google"} className="btn-secondary text-sm">Google</button>
          <button onClick={() => window.location.href = "http://localhost:5000/api/auth/facebook"} className="btn-secondary text-sm">Facebook</button>
        </div>

        <p className="mt-10 text-center text-sm text-text-muted font-medium">
          New here?{' '}
          <Link href="/signup" className="text-primary font-bold hover:text-primary-light">Create Account</Link>
        </p>
      </div>
    </main>
  );
}
