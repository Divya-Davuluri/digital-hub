'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { apiFetch } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Profile State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('Managing high-growth marketing campaigns for global brands.');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, []);

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const data = await apiFetch('/auth/update-profile', {
        method: 'POST',
        body: JSON.stringify({ name, email }),
      });
      
      localStorage.setItem('user', JSON.stringify(data.user));
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Update header/sidebar by firing a storage event or just refreshing
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile Info', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
    { id: 'security', label: 'Security & 2FA', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    )},
    { id: 'notifications', label: 'Notifications', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    )},
    { id: 'billing', label: 'Plan & Billing', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )},
  ];

  return (
    <div className="flex min-h-screen bg-background text-text">
      <Sidebar />
      
      <div className="flex-1 ml-64 min-h-screen bg-grid relative">
        <Header />
        
        <main className="p-8 max-w-5xl mx-auto animate-fade-in relative z-10">
          <header className="mb-12">
            <h1 className="text-4xl font-black tracking-tight mb-2">Account Settings</h1>
            <p className="text-text-muted font-medium">Manage your agency profile, security preferences, and subscription.</p>
          </header>

          {message.text && (
            <div className={`mb-8 p-4 rounded-2xl border ${message.type === 'success' ? 'bg-green-400/10 border-green-400/20 text-green-400' : 'bg-red-400/10 border-red-400/20 text-red-400'} text-xs font-black uppercase tracking-widest flex items-center gap-3`}>
              <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-400' : 'bg-red-400'}`} />
              {message.text}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Navigation Tabs */}
            <nav className="w-full lg:w-72 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                    activeTab === tab.id 
                      ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' 
                      : 'text-text-muted hover:text-text hover:bg-white/5'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-white' : 'text-primary'}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Content Area */}
            <div className="flex-1 card p-10 min-h-[500px]">
              {activeTab === 'profile' && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h3 className="text-2xl font-black mb-1">Profile Information</h3>
                    <p className="text-sm text-text-muted font-medium">Update your personal and agency details.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Full Name</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Email Address</label>
                      <input 
                        type="email" 
                        className="input-field" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Bio / Description</label>
                    <textarea 
                      className="input-field h-32 resize-none" 
                      value={bio} 
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                  
                  <div className="pt-4">
                    <button 
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="btn-primary w-full md:w-auto px-12 shadow-xl shadow-primary/20"
                    >
                      {loading ? 'Processing...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-10 animate-fade-in">
                  <div>
                    <h3 className="text-2xl font-black mb-1">Security Settings</h3>
                    <p className="text-sm text-text-muted font-medium">Keep your account secure with 2FA and strong passwords.</p>
                  </div>
                  
                  <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 group">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-black text-lg uppercase tracking-tight">Two-Factor Authentication</h4>
                        <p className="text-[11px] text-text-muted mt-1 leading-relaxed max-w-xs font-medium">Secure your account with an additional layer of verification from your device.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => router.push('/2fa-setup')}
                      className="btn-primary !px-8 text-xs !py-3 shadow-lg shadow-primary/20"
                    >
                      Setup 2FA Now
                    </button>
                  </div>

                  <div className="space-y-6 pt-10 border-t border-white/5">
                    <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-text-muted">Credential Management</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <input type="password" placeholder="Current Password" className="input-field" />
                      <input type="password" placeholder="New Password" className="input-field" />
                    </div>
                    <button className="btn-secondary w-full md:w-auto">Update Password</button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-fade-in py-20">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-4xl shadow-inner">🔔</div>
                  <h3 className="text-3xl font-black uppercase tracking-tight">Stay Informed</h3>
                  <p className="text-text-muted max-w-xs mx-auto font-medium">Notification engine is being fine-tuned to deliver real-time campaign insights.</p>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="space-y-10 animate-fade-in">
                  <div>
                    <h3 className="text-2xl font-black mb-1">Financial Overview</h3>
                    <p className="text-sm text-text-muted font-medium">Manage your subscription tiers and billing artifacts.</p>
                  </div>
                  
                  <div className="relative overflow-hidden p-10 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-[2rem] border border-primary/20 group">
                    <div className="absolute top-0 right-0 p-6">
                       <span className="bg-primary/20 text-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">Active Subscription</span>
                    </div>
                    <div className="relative z-10">
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Tier Status</span>
                      <h4 className="text-4xl font-black mt-3 mb-2 tracking-tighter">Growth Agency Pro</h4>
                      <p className="text-text-muted font-medium mb-10">$199 / Month • Next settlement May 27, 2026</p>
                      <div className="flex flex-wrap gap-4">
                        <button className="btn-primary !px-10">Upgrade Tier</button>
                        <button className="btn-secondary">Invoicing Portal</button>
                      </div>
                    </div>
                    {/* Decorative abstract */}
                    <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-primary/20 rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-1000" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
