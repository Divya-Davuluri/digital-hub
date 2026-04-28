'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  role?: 'admin' | 'team' | 'client';
}

export default function Sidebar({ role = 'admin' }: SidebarProps) {
  const pathname = usePathname();

  const getMenuItems = () => {
    const common = [
      { name: 'Overview', href: `/dashboard/${role}`, icon: '🏠' },
    ];

    if (role === 'admin') {
      return [
        ...common,
        { name: 'Manage Clients', href: '/dashboard/admin/clients', icon: '🏢' },
        { name: 'View Team', href: '/dashboard/team', icon: '👥' }, // Admin can see team dashboard
        { name: 'Analytics', href: '/dashboard/admin', icon: '📈' },
        { name: 'Settings', href: '/dashboard/admin', icon: '🎨' },
      ];
    }

    if (role === 'team') {
      return [
        ...common,
        { name: 'Assigned Clients', href: '/dashboard/team/clients', icon: '💼' },
        { name: 'Campaigns', href: '/dashboard/team/campaigns', icon: '🚀' },
        { name: 'Tasks', href: '/dashboard/team/tasks', icon: '✅' },
      ];
    }

    // Client Role
    return [
      ...common,
      { name: 'Campaigns', href: '/dashboard/client/campaigns', icon: '📊' },
      { name: 'Reports', href: '/dashboard/client/reports', icon: '📄' },
      { name: 'Billing', href: '/dashboard/client/billing', icon: '💳' },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-[260px] h-screen bg-slate-900 border-r border-white/5 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
          <div className="w-5 h-5 bg-white rounded-sm rotate-45" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">Hub<span className="text-indigo-500">SaaS</span></span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        <div className="px-3 mb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{role} Dashboard</div>
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
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active Agency</div>
          <div className="text-xs font-bold text-white">Digital Marketing Hub</div>
        </div>
      </div>
    </aside>
  );
}
