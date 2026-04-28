'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is authenticated (token exists in localStorage)
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsAuthenticated(false);
      // Redirect to login if trying to access protected routes
      if (pathname?.startsWith('/dashboard') || 
          pathname?.startsWith('/settings') || 
          pathname?.startsWith('/analytics') || 
          pathname?.startsWith('/projects')) {
        router.push('/login');
      }
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  // Show nothing or a loader while checking authentication to prevent flicker
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If not authenticated and on a protected route, it will redirect, but we return null to prevent rendering
  if (!isAuthenticated && (pathname?.startsWith('/dashboard') || pathname?.startsWith('/settings') || pathname?.startsWith('/analytics'))) {
    return null;
  }

  return <>{children}</>;
}
