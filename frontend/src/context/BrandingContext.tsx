'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Branding {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  subdomain: string;
}

interface BrandingContextType {
  branding: Branding | null;
  loading: boolean;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);

  const applyBranding = (data: Branding) => {
    if (typeof document !== 'undefined') {
      document.body.style.setProperty('--primary-color', data.primaryColor || '#4f46e5');
      document.body.style.setProperty('--secondary-color', data.secondaryColor || '#10b981');
    }
  };

  const fetchBranding = async () => {
    try {
      setLoading(true);
      // Step 3: Fetch from GET /api/admin/branding
      // Note: We use /api/branding for public (login) and /api/admin/branding for admin
      // But for simplicity in the context, we'll try admin first, fallback to public
      const data = await apiFetch('/admin/branding').catch(() => apiFetch('/branding'));
      
      setBranding(data);
      applyBranding(data);
      
      // Save to localStorage as backup
      localStorage.setItem('branding', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to fetch branding:', error);
      
      // Fallback to localStorage
      const cached = localStorage.getItem('branding');
      if (cached) {
        const data = JSON.parse(cached);
        setBranding(data);
        applyBranding(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, loading, refreshBranding: fetchBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
