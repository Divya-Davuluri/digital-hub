'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

export default function TwoFASetupPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [step, setStep] = useState(1); // 1: QR, 2: Backup Codes

  useEffect(() => {
    const fetchSetupData = async () => {
      try {
        const data = await apiFetch('/auth/2fa/setup', { method: 'POST' });
        setQrCode(data.qrCode);
        setSecret(data.secret);
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Failed to initialize 2FA' });
      }
    };
    fetchSetupData();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = await apiFetch('/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      
      setBackupCodes(data.backupCodes);
      setStep(2); // Move to backup codes screen
    } catch (err: any) {
      setToken('');
      setMessage({ type: 'error', text: err.message || 'Invalid code' });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
        <div className="absolute top-1/4 right-1/4 w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-[440px] card p-10">
        {step === 1 ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Set up 2FA</h2>
              <p className="text-text-muted mt-2 text-sm">Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.).</p>
            </div>

            {message.text && (
              <div className="mb-6 p-4 rounded-xl text-xs font-bold border bg-red-500/10 text-red-400 border-red-500/20">
                {message.text}
              </div>
            )}

            {qrCode ? (
              <div className="flex justify-center mb-8 bg-white p-4 rounded-xl">
                <Image src={qrCode} alt="2FA QR Code" width={192} height={192} unoptimized />
              </div>
            ) : (
              <div className="flex justify-center mb-8 h-48 items-center">
                <div className="w-10 h-10 border-t-2 border-primary rounded-full animate-spin"></div>
              </div>
            )}

            <div className="text-center mb-8">
               <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-2">Or enter this manual code</p>
               <code className="bg-white/5 px-4 py-2 rounded text-sm tracking-widest font-mono text-primary">{secret || 'Loading...'}</code>
            </div>

            <form className="space-y-6" onSubmit={handleVerify}>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-muted uppercase tracking-widest pl-1 text-center">Enter 6-Digit Code</label>
                <input 
                  type="text" 
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                  className="input-field text-center text-2xl tracking-[0.5em] font-bold py-4"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <button type="submit" disabled={loading || !token} className="btn-primary w-full">
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                 </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">2FA Enabled!</h2>
              <p className="text-text-muted mt-2 text-sm">Save these backup codes in a secure location. You can use them to log in if you lose your device.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
              <div className="grid grid-cols-2 gap-4 text-center font-mono text-sm tracking-widest text-primary">
                {backupCodes.map((code, i) => (
                  <div key={i} className="bg-background py-2 rounded">{code}</div>
                ))}
              </div>
            </div>

            <button onClick={handleComplete} className="btn-primary w-full">
              I have saved my backup codes
            </button>
          </>
        )}
        
        {step === 1 && (
           <div className="mt-8 text-center">
              <Link href="/dashboard" className="text-xs text-text-muted hover:text-white font-bold uppercase tracking-widest">Cancel Setup</Link>
           </div>
        )}
      </div>
    </main>
  );
}
