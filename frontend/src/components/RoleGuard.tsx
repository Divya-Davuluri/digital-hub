'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: ('admin' | 'team' | 'client')[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user && !allowedRoles.includes(user.role)) {
        // Redirect to their respective dashboard if they try to access an unauthorized route
        if (user.role === 'admin') router.push('/dashboard/admin');
        else if (user.role === 'team') router.push('/dashboard/team');
        else if (user.role === 'client') router.push('/dashboard/client');
        else router.push('/dashboard');
      }
    }
  }, [user, loading, isAuthenticated, allowedRoles, router]);

  if (loading || !isAuthenticated || (user && !allowedRoles.includes(user.role))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium animate-pulse text-sm tracking-widest uppercase">Checking Permissions...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
