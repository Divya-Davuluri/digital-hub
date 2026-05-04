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
        { name: 'Campaigns', href: '/projects', icon: '🚀' },
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
    <aside className="w-[260px] h-screen bg-slate-900 border-r border-white/5 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3">
        {branding?.logoUrl ? (
          <Image 
            src={branding.logoUrl} 
            alt="Logo" 
            width={120}
            height={40}
            style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
            unoptimized
          />
        ) : (
          <>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20" style={{ backgroundColor: branding?.primaryColor }}>
              <div className="w-5 h-5 bg-white rounded-sm rotate-45" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Hub<span style={{ color: branding?.primaryColor || '#6366f1' }}>SaaS</span></span>
          </>
        )}
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="px-3 mb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{role} Portal</div>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/5">
        <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="text-xs font-bold text-white">System Online</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
