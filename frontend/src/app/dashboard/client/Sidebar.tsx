import { useBranding } from '@/context/BrandingContext';

interface SidebarProps {
  role?: 'admin' | 'team' | 'client';
}

export default function Sidebar({ role = 'admin' }: SidebarProps) {
  const pathname = usePathname();
  const { branding } = useBranding();

  const getMenuItems = () => {
    const common = [
      { name: 'Overview', href: `/dashboard/${role}`, icon: '🏠' },
    ];

    if (role === 'admin') {
      return [
        ...common,
        { name: 'Clients', href: '/dashboard/admin/clients', icon: '🏢' },
        { name: 'Team', href: '/dashboard/admin/team', icon: '👥' },
        { name: 'Platform Stats', href: '/dashboard/admin/stats', icon: '📈' },
        { name: 'White-label', href: '/dashboard/admin/branding', icon: '🎨' },
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
    <aside className="w-[260px] h-screen bg-white border-r border-border flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-2.5">
        {branding?.logoUrl ? (
          <img src={branding.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
        ) : (
          <>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200" style={{ backgroundColor: branding?.primaryColor }}>
              <span className="text-white text-xs font-black">DH</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Hub<span style={{ color: branding?.primaryColor || '#4f46e5' }}>SaaS</span></span>
          </>
        )}
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{role} Menu</div>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                isActive 
                  ? 'text-white' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              style={isActive ? { backgroundColor: branding?.primaryColor || '#4f46e5' } : {}}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="bg-slate-50 rounded-xl p-4 border border-border">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Tenant</div>
          <div className="text-xs font-bold text-slate-900">Digital Agency Hub</div>
        </div>
      </div>
    </aside>
  );
}
