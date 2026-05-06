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
    <aside style={{
      width: '260px',
      height: '100vh',
      background: 'white',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 50
    }}>
      <div style={{ padding: '24px' }}>
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
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: '#4f46e5',
              borderRadius: '8px'
            }} />
            HubSaaS
          </div>
        )}
      </div>

      <nav style={{
        flex: 1,
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                color: isActive ? '#4f46e5' : '#4b5563',
                background: isActive ? '#eef2ff' : 'transparent',
                textDecoration: 'none',
                fontWeight: isActive ? '600' : '500',
                fontSize: '15px'
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div style={{
        padding: '24px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        color: '#6b7280',
        fontWeight: '500'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          background: '#10b981',
          borderRadius: '50%'
        }} />
        STATUS - System Online
      </div>
    </aside>
  );
}
