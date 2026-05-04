'use client';

import { useState } from 'react';
import Image from 'next/image';

interface TwoFASetupProps {
  user: any;
  onComplete: () => void;
  onCancel: () => void;
}

export default function TwoFASetup({ user, onComplete, onCancel }: TwoFASetupProps) {
  const [step, setStep] = useState(1); // 1: Intro, 2: Scan QR, 3: Verify
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId: user.id }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setStep(2);
      } else {
        setError(data.message || 'Failed to initialize 2FA');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/2fa/verify-setup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId: user.id, token }),
      });
      
      const data = await res.json();
      if (res.ok) {
        onComplete();
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-md">
      <div className="bg-background dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-high border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-lg border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">Two-Factor Authentication</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-foreground transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-lg">
          {error && (
            <div className="mb-md p-sm bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-m border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-md text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-md">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Secure your account</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Add an extra layer of security to your account by requiring a code from your Google Authenticator app.
              </p>
              <button 
                onClick={initSetup}
                disabled={loading}
                className="btn-primary w-full mt-md"
              >
                {loading ? 'Initializing...' : 'Get Started'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-lg text-center">
              <div className="space-y-sm">
                <p className="text-sm font-medium">1. Scan this QR code in your app</p>
                <div className="bg-white p-sm rounded-xl inline-block border border-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <Image 
                    src={qrCode} 
                    alt="2FA QR Code" 
                    width={192}
                    height={192}
                    className="w-48 h-48"
                    unoptimized
                  />
                </div>
                <div className="mt-sm">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Or enter code manually</p>
                  <code className="text-primary font-mono text-sm font-bold bg-surface px-sm py-xs rounded">{secret}</code>
                </div>
              </div>

              <div className="space-y-sm">
                <p className="text-sm font-medium">2. Enter the 6-digit verification code</p>
                <input 
                  type="text"
                  placeholder="000 000"
                  maxLength={6}
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-2xl font-bold tracking-[0.5em] py-md border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-transparent transition-all"
                />
              </div>

              <button 
                onClick={verifyAndEnable}
                disabled={loading || token.length !== 6}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
