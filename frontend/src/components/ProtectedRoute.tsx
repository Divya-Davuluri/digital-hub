'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      setIsAuthorized(false);
      if (pathname !== '/login' && pathname !== '/signup' && pathname !== '/') {
        router.push('/login');
      }
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      // VALIDATE ROLE: Only allow 'admin', 'team', or 'client'
      // If the role is unknown (like 'user'), default to 'team' or 'admin' based on user status
      let role = user.role;
      if (role !== 'admin' && role !== 'team' && role !== 'client') {
        console.warn(`[ProtectedRoute] Unknown role detected: "${role}". Defaulting to "team".`);
        role = 'team';
      }

      // 1. Handle root /dashboard redirect to specific role dashboard
      if (pathname === '/dashboard' || pathname === '/dashboard/') {
        router.push(`/dashboard/${role}`);
        return;
      }

      // 2. Role-based route protection
      const isAdminRoute = pathname.startsWith('/dashboard/admin');
      const isTeamRoute = pathname.startsWith('/dashboard/team');
      const isClientRoute = pathname.startsWith('/dashboard/client');

      if (isAdminRoute && role !== 'admin') {
        router.push(`/dashboard/${role}`);
        return;
      }
      if (isTeamRoute && role !== 'team' && role !== 'admin') {
        router.push(`/dashboard/${role}`);
        return;
      }
      if (isClientRoute && role !== 'client' && role !== 'admin') {
        router.push(`/dashboard/${role}`);
        return;
      }

      // 3. Handle dead-end routes like /dashboard/user
      if (pathname === '/dashboard/user' || pathname === '/dashboard/user/') {
        router.push(`/dashboard/${role}`);
        return;
      }

      setIsAuthorized(true);
    } catch (e) {
      localStorage.clear();
      router.push('/login');
    }
  }, [pathname, router]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
