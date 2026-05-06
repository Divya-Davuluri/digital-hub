'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useBranding } from '@/context/BrandingContext';
import Image from 'next/image';

interface SidebarProps {
  role?: 'admin' | 'team' | 'client';
}

export default function Sidebar({ role: initialRole }: SidebarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<'admin' | 'team' | 'client'>(initialRole || 'admin');

  useEffect(() => {
    if (!initialRole) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setRole(user.role || 'client');
        } catch (e) {
          console.error("Failed to parse user for sidebar", e);
        }
      }
    }
  }, [initialRole]);

  const getMenuItems = () => {
    const common = [
      { name: 'Overview', href: `/dashboard/${role}`, icon: '🏠' },
    ];

    if (role === 'admin') {
      return [
        ...common,
        { name: 'Manage Clients', href: '/dashboard/admin/clients', icon: '🏢' },
        { name: 'Agency Branding', href: '/dashboard/admin/branding', icon: '🎨' },
        { name: 'Campaigns', href: '/projects', icon: '🚀' },
        { name: 'Reports', href: '/dashboard/admin', icon: '📈' },
        { name: 'Settings', href: '/settings', icon: '⚙️' },
      ];
    }

    if (role === 'team') {
      return [
        ...common,
        { name: 'Clients', href: '/dashboard/team/clients', icon: '💼' },
        { name: 'Tasks', href: '/dashboard/team/tasks', icon: '✅' },
        { name: 'Campaigns', href: '/dashboard/team/campaigns', icon: '🚀' },
      ];
    }

    // Client Role
    return [
      ...common,
      { name: 'My Campaigns', href: '/dashboard/client/campaigns', icon: '📊' },
      { name: 'Reports', href: '/dashboard/client/reports', icon: '📄' },
      { name: 'Billing', href: '/dashboard/client/billing', icon: '💳' },
    ];
  };

  const menuItems = getMenuItems();

  const { branding } = useBranding();

  return (
    <aside className="w-[280px] h-screen bg-[#020617] border-r border-white/5 flex flex-col fixed left-0 top-0 z-50 overflow-hidden shadow-2xl">
      {/* Decorative gradient corner */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      
      <div className="p-8 flex items-center gap-4 relative">
        {branding?.logoUrl ? (
          <Image 
            src={branding.logoUrl} 
            alt="Logo" 
            width={140}
            height={40}
            style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
            unoptimized
          />
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-2xl relative overflow-hidden group" style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}>
               <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
               <div className="w-5 h-5 bg-white rounded-[4px] rotate-[15deg] group-hover:rotate-[195deg] transition-transform duration-700" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white uppercase italic">Hub<span style={{ color: branding?.primaryColor || '#6366f1' }}>Sync</span></span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto relative scrollbar-hide">
        <div className="px-5 mb-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] opacity-60">System Navigation</div>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              <span className={`text-xl transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span className="tracking-wide">{item.name}</span>
              {isActive && (
                <div className="absolute right-4 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 relative">
        <div className="glass-panel p-5 bg-white/[0.02] border-white/5 relative overflow-hidden group hover:border-primary/20 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 relative">Infrastructure</div>
          <div className="flex items-center gap-3 relative">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
              <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-40"></div>
            </div>
            <div className="text-[11px] font-bold text-white/80 uppercase tracking-widest">Active & Sync</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
