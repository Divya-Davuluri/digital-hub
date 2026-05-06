'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getNotifications, markNotificationAsRead, Notification } from '@/services/notificationService';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

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

    const fetchNotifications = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    fetchUser();
    fetchNotifications();
    window.addEventListener('storage', fetchUser);
    return () => window.removeEventListener('storage', fetchUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Error marking as read", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="h-[80px] border-b border-white/5 flex items-center justify-between px-10 bg-[#020617]/50 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Search Protocol..." 
            className="w-72 bg-white/[0.03] border border-white/5 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white transition-all focus:w-96 focus:bg-white/[0.07] focus:border-primary/40 focus:outline-none placeholder:text-slate-500 font-bold tracking-wide"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Notification Center */}
        <div className="relative">
          <button 
            onClick={() => { setShowNotifications(!showNotifications); setShowDropdown(false); }}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all relative border border-transparent hover:border-white/5"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-4 w-96 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl py-2 animate-fade-in z-50 backdrop-blur-2xl">
              <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                <span className="font-black text-xs uppercase tracking-[0.2em] text-white">Security Alerts</span>
                {unreadCount > 0 && <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-full font-black uppercase tracking-widest">{unreadCount} New</span>}
              </div>
              <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">No active alerts</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`px-6 py-4 hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-white/5 last:border-none ${!n.isRead ? 'bg-primary/[0.02]' : ''}`}
                      onClick={() => handleMarkAsRead(n.id)}
                    >
                      <div className="flex gap-4">
                        <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${!n.isRead ? 'bg-primary shadow-[0_0_8px_var(--primary)]' : 'bg-slate-700'}`}></div>
                        <div className="space-y-1">
                          <p className={`text-xs leading-relaxed ${!n.isRead ? 'font-bold text-white' : 'text-slate-400'}`}>{n.message}</p>
                          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{new Date(n.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-white/5 mx-2"></div>

        <div className="relative">
          <button 
            onClick={() => { setShowDropdown(!showDropdown); setShowNotifications(false); }}
            className="flex items-center gap-4 p-1.5 rounded-2xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm border border-primary/20 shadow-inner group-hover:scale-105 transition-transform">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="text-left hidden md:block mr-2">
              <p className="text-sm font-black text-white leading-tight uppercase tracking-tighter italic">{user?.name || 'Authorized User'}</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{user?.role || 'Operator'}</p>
            </div>
            <svg className={`w-4 h-4 text-slate-500 transition-transform duration-500 ${showDropdown ? 'rotate-180 text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-4 w-64 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl py-2 animate-fade-in z-50 backdrop-blur-2xl">
              <div className="px-6 py-4 border-b border-white/5 mb-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Identity verified</p>
                <p className="text-xs font-bold text-white/80 truncate">{user?.email}</p>
              </div>
              <button 
                onClick={() => { router.push('/settings'); setShowDropdown(false); }}
                className="w-full text-left px-6 py-3 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all uppercase tracking-widest"
              >
                Personal Profile
              </button>
              {user?.role === 'admin' && (
                <button 
                  onClick={() => { router.push('/dashboard/admin/branding'); setShowDropdown(false); }}
                  className="w-full text-left px-6 py-3 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all uppercase tracking-widest"
                >
                  Visual Assets
                </button>
              )}
              <div className="h-px bg-white/5 my-2 mx-4"></div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-6 py-3 text-xs font-black text-red-400 hover:bg-red-500/10 transition-all uppercase tracking-[0.2em]"
              >
                Terminate Session
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
