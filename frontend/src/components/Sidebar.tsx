'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useBranding } from '@/context/BrandingContext';
import { Zap, Link as LinkIcon, Search } from 'lucide-react';

interface SidebarProps {
  role?: 'admin' | 'team' | 'client';
}

export default function Sidebar({ role: initialRole }: SidebarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<'admin' | 'team' | 'client'>(initialRole || 'client');

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
    } else {
      setRole(initialRole);
    }
  }, [initialRole]);

  const getMenuItems = () => {
    if (role === 'admin') {
      return [
        { name: 'Overview', href: '/dashboard/admin', icon: '🏠' },
        { name: 'Contacts', href: '/dashboard/contacts', icon: '👥' },
        { name: 'SEO', href: '/dashboard/seo', icon: <Search size={18} /> },
        { name: 'Analytics', href: '/dashboard/analytics', icon: '📊' },
        { name: 'Attribution', href: '/dashboard/attribution', icon: '🌿' },
        { name: 'Social', href: '/dashboard/social', icon: '📅' },
        { name: 'Workflows', href: '/dashboard/workflows', icon: <Zap size={18} /> },
        { name: 'Links', href: '/dashboard/links', icon: <LinkIcon size={18} /> },
        {
          name: 'Instagram',
          href: '/dashboard/instagram',
          icon: (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          )
        },
        { name: 'Manage Clients', href: '/dashboard/admin/clients', icon: '🏢' },
        { name: 'Team Members', href: '/dashboard/admin/team-members', icon: '👥' },
        { name: 'Campaigns', href: '/dashboard/campaigns', icon: '🚀' },
        { name: 'Budget', href: '/dashboard/budget', icon: '💰' },
        { name: 'Creative Assets', href: '/dashboard/creatives', icon: '🖼️' },
        { name: 'White-Labeling', href: '/dashboard/settings/branding', icon: '🎨' },
        { name: 'Reports', href: '/dashboard/reports', icon: '📈' },
        { name: 'Settings', href: '/dashboard/admin/settings', icon: '⚙️' },
      ];
    }

    if (role === 'team') {
      return [
        { name: 'Overview', href: '/dashboard/team', icon: '🏠' },
        { name: 'Contacts', href: '/dashboard/contacts', icon: '👥' },
        { name: 'SEO', href: '/dashboard/seo', icon: <Search size={18} /> },
        { name: 'Analytics', href: '/dashboard/analytics', icon: '📊' },
        { name: 'Attribution', href: '/dashboard/attribution', icon: '🌿' },
        { name: 'Social', href: '/dashboard/social', icon: '📅' },
        { name: 'Workflows', href: '/dashboard/workflows', icon: <Zap size={18} /> },
        { name: 'Links', href: '/dashboard/links', icon: <LinkIcon size={18} /> },
        {
          name: 'Instagram',
          href: '/dashboard/instagram',
          icon: (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          )
        },
        { name: 'Assigned Clients', href: '/dashboard/team/assigned-clients', icon: '💼' },
        { name: 'Campaigns', href: '/dashboard/campaigns', icon: '🚀' },
        { name: 'Budget', href: '/dashboard/budget', icon: '💰' },
        { name: 'Creative Assets', href: '/dashboard/creatives', icon: '🖼️' },
        { name: 'Reports', href: '/dashboard/reports', icon: '📈' },
      ];
    }

    // Client Role
    return [
      { name: 'Overview', href: '/dashboard/client', icon: '🏠' },
      { name: 'Campaigns', href: '/dashboard/client/campaigns', icon: '🚀' },
      { name: 'Reports', href: '/dashboard/client/reports', icon: '📄' },
      { name: 'Analytics', href: '/dashboard/client/analytics', icon: '📈' },
    ];
  };

  const menuItems = getMenuItems();
  const { branding } = useBranding();
  const isLightTheme = branding?.sidebarTheme === 'light';

  return (
    <aside 
      className={`w-[260px] h-screen border-r flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ${
        isLightTheme 
          ? 'bg-white border-slate-200 text-slate-900' 
          : 'text-white border-white/5'
      }`}
      style={{
        backgroundColor: branding?.sidebarTheme === 'primary' 
          ? (branding.primaryColor || '#4f46e5')
          : isLightTheme
          ? '#ffffff'
          : (branding?.sidebarBg || '#0f172a')
      }}
    >
      <div className="p-6 flex items-center gap-3">
        {branding?.logoUrl ? (
          <Image 
            src={branding.logoUrl} 
            alt="Logo" 
            width={120}
            height={40}
            className="h-10 w-auto object-contain" 
            unoptimized
          />
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}>
              <div className="w-5 h-5 bg-white rounded-sm rotate-45" />
            </div>
            <span className={`text-xl font-bold tracking-tight ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>Hub<span style={{ color: branding?.primaryColor || '#6366f1' }}>SaaS</span></span>
          </>
        )}
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className={`px-3 mb-4 text-[10px] font-bold uppercase tracking-widest ${
          isLightTheme ? 'text-slate-400' : 'text-slate-500'
        }`}>{role} Portal</div>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                isActive 
                  ? 'text-white' 
                  : isLightTheme
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              style={isActive ? { 
                backgroundColor: branding?.primaryColor || '#4f46e5',
                boxShadow: `0 10px 15px -3px ${(branding?.primaryColor || '#4f46e5')}33`
              } : {}}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1">{item.name}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className={`p-6 border-t ${isLightTheme ? 'border-slate-100' : 'border-white/5'}`}>
        <div className={`rounded-2xl p-5 border ${isLightTheme ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
          <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isLightTheme ? 'text-slate-400' : 'text-slate-500'}`}>Status</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className={`text-xs font-bold ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>System Online</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
