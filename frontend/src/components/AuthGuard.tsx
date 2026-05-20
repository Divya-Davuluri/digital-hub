'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    const role = user.role;
    let allowed = true;

    // Admin permissions: access to all dashboard routes
    if (role === 'admin') {
      allowed = true;
    } 
    // Team permissions
    else if (role === 'team') {
      const blockedTeamRoutes = ['/dashboard/billing', '/dashboard/settings'];
      if (pathname.startsWith('/dashboard/admin') || blockedTeamRoutes.some(route => pathname.startsWith(route))) {
        allowed = false;
      }
    } 
    // Client permissions
    else if (role === 'client') {
      const blockedClientRoutes = [
        '/dashboard/admin',
        '/dashboard/team',
        '/dashboard/workflows',
        '/dashboard/contacts',
        '/dashboard/billing',
        '/dashboard/settings',
        '/dashboard/social'
      ];
      if (blockedClientRoutes.some(route => pathname.startsWith(route))) {
        allowed = false;
      }
    }

    setIsAuthorized(allowed);
  }, [loading, isAuthenticated, user, pathname, router]);

  if (loading || isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
            🔒
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            You don't have permission to view this page. If you believe this is a mistake, please contact your administrator.
          </p>
          <button 
            onClick={() => {
              if (user?.role === 'admin') router.push('/dashboard/admin');
              else if (user?.role === 'team') router.push('/dashboard/team');
              else router.push('/dashboard/client');
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Go to My Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
