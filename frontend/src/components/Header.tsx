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
    <header className="h-[64px] border-b border-border flex items-center justify-between px-8 bg-white sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="w-64 bg-slate-50 border border-transparent rounded-lg pl-10 pr-4 py-1.5 text-sm transition-all focus:w-80 focus:bg-white focus:border-primary/40 focus:outline-none placeholder:text-slate-400"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hidden md:block">
            <kbd className="text-[10px] font-medium bg-white px-1.5 py-0.5 rounded border border-border shadow-sm">⌘K</kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors relative">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-6 w-px bg-border mx-1"></div>

        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-50 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-primary flex items-center justify-center font-bold text-sm border border-indigo-100">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="text-left hidden md:block mr-1">
              <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.name || 'User'}</p>
              <p className="text-[11px] text-slate-500 font-medium">Administrator</p>
            </div>
            <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-border rounded-xl shadow-xl py-1 animate-subtle-fade z-50">
              <div className="px-4 py-3 border-b border-border mb-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account</p>
                <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
              </div>
              <button 
                onClick={() => { router.push('/settings'); setShowDropdown(false); }}
                className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                Profile Settings
              </button>
              <button 
                onClick={() => { router.push('/billing'); setShowDropdown(false); }}
                className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                Billing & Plan
              </button>
              <div className="h-px bg-border my-1"></div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
