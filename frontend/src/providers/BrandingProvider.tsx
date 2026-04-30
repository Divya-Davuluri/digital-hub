'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getBranding, BrandingSettings } from '@/services/brandingService';

interface BrandingContextType {
  branding: BrandingSettings | null;
  loading: boolean;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBranding = async () => {
    try {
      const data = await getBranding();
      if (data) {
        setBranding(data);
        applyBranding(data);
      }
    } catch (err) {
      // Gracefully handle missing branding (e.g. on login page)
      console.warn('Branding not available for current context');
    } finally {
      setLoading(false);
    }
  };

  const applyBranding = (settings: BrandingSettings) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', settings.primaryColor || '#4f46e5');
      root.style.setProperty('--secondary-color', settings.secondaryColor || '#10b981');
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
}

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
