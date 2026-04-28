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
      if (pathname !== '/login' && pathname !== '/signup') {
        router.push('/login');
      }
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      // Fallback to 'admin' or 'team' if role is missing, or redirect to a default
      const role = user.role || 'team'; 

      // 1. Handle root /dashboard redirect to specific role dashboard
      if (pathname === '/dashboard' || pathname === '/dashboard/') {
        router.push(`/dashboard/${role}`);
        return;
      }

      // 2. Role-based route protection
      if (pathname.startsWith('/dashboard/admin') && role !== 'admin') {
        router.push(`/dashboard/${role}`);
        return;
      }
      if (pathname.startsWith('/dashboard/team') && role !== 'team' && role !== 'admin') {
        router.push(`/dashboard/${role}`);
        return;
      }
      if (pathname.startsWith('/dashboard/client') && role !== 'client' && role !== 'admin') {
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
