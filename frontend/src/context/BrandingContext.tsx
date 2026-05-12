'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiCall from '@/lib/api';

interface Branding {
  agencyName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  customCss: string;
  removePoweredBy: number;
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
      const root = document.documentElement;
      root.style.setProperty('--primary-color', data.primaryColor || '#6366f1');
      root.style.setProperty('--secondary-color', data.secondaryColor || '#4f46e5');
      
      // Apply Favicon
      if (data.faviconUrl) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = data.faviconUrl;
      }

      // Apply Custom CSS
      if (data.customCss) {
        let style: HTMLStyleElement | null = document.querySelector("#custom-branding-css");
        if (!style) {
          style = document.createElement('style');
          style.id = 'custom-branding-css';
          document.head.appendChild(style);
        }
        style.innerHTML = data.customCss;
      }
    }
  };

  const fetchBranding = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch public branding (which uses domain detection on backend)
      const data = await apiCall('/branding');
      
      setBranding(data);
      applyBranding(data);
      
      localStorage.setItem('branding', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to fetch branding:', error);
      const cached = localStorage.getItem('branding');
      if (cached) {
        const data = JSON.parse(cached);
        setBranding(data);
        applyBranding(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

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
