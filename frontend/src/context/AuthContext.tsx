'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import apiCall from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'team' | 'client';
  tenantId: string;
  workspaceId?: string | null;
  onboardingCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (data: any) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Load from storage on init
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Handle auto-redirect for incomplete onboarding
        if (parsedUser.role === 'client' && parsedUser.onboardingCompleted === false && pathname !== '/onboarding/client') {
          router.push('/onboarding/client');
        }
      } catch (e) {
        console.error('Failed to parse stored user');
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = (data: { token: string; refreshToken: string; user: User }) => {
    if (!data.user) {
      console.error('Login failed: User data missing in response', data);
      throw new Error('Authentication failed: Missing user profile data');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    setToken(data.token);
    setUser(data.user);

    // Redirect based on role and onboarding status
    if (data.user.role === 'admin') {
      router.push('/dashboard/admin');
    } else if (data.user.role === 'team') {
      router.push('/dashboard/team');
    } else if (data.user.role === 'client') {
      if (data.user.onboardingCompleted === false) {
        router.push('/onboarding/client');
      } else {
        router.push('/dashboard/client');
      }
    } else {
      router.push('/dashboard');
    }
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await apiCall('/api/settings/profile');
      const newUser = { ...user, ...updatedUser, onboardingCompleted: updatedUser.onboardingCompleted === 1 };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch (err) {
      console.error("Failed to refresh user", err);
    }
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      logout,
      refreshUser,
      isAuthenticated: !!token 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
