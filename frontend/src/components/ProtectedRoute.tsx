'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;

    // Public pages
    const publicPages = ['/login', '/signup', '/'];
    if (publicPages.includes(pathname)) {
      setIsAuthorized(true);
      return;
    }

    if (!isAuthenticated) {
      setIsAuthorized(false);
      router.push('/login');
      return;
    }

    if (user) {
      const role = user.role;

      // Handle root /dashboard redirect
      if (pathname === '/dashboard' || pathname === '/dashboard/') {
        router.push(`/dashboard/${role}`);
        return;
      }

      // Role-based protection
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

      setIsAuthorized(true);
    }
  }, [pathname, router, user, loading, isAuthenticated]);

  if (loading || isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
