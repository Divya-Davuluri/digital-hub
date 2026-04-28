'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user", e);
        }
      }
    };

    fetchUser();
    window.addEventListener('storage', fetchUser);
    return () => window.removeEventListener('storage', fetchUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-background/50 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Search campaigns, users, reports..." 
            className="w-96 bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-2.5 text-sm transition-all focus:w-[450px] focus:bg-white/[0.05] focus:border-primary/40 focus:outline-none placeholder:text-text-muted"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
            <kbd className="text-[10px] font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/10">⌘K</kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-text-muted hover:text-text transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 p-1 pr-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-sm shadow-lg">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold">{user?.name || 'User'}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-widest font-black">Admin</p>
            </div>
            <svg className={`w-4 h-4 text-text-muted transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-56 card p-2 shadow-2xl animate-fade-in">
              <div className="px-4 py-3 border-b border-white/5 mb-2">
                <p className="text-xs font-bold">{user?.email}</p>
                <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">Free Tier</p>
              </div>
              <button 
                onClick={() => { router.push('/settings'); setShowDropdown(false); }}
                className="w-full text-left px-4 py-2 text-sm text-text-muted hover:text-text hover:bg-white/5 rounded-xl transition-all"
              >
                Settings
              </button>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
