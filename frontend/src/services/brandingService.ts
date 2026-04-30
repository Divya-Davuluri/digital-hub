import { apiFetch } from '@/lib/api';

export interface BrandingSettings {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  subdomain?: string;
}

export const getBranding = async (): Promise<BrandingSettings> => {
  return apiFetch('/branding');
};

export const updateBranding = async (settings: BrandingSettings): Promise<void> => {
  return apiFetch('/branding', {
    method: 'POST',
    body: JSON.stringify(settings),
  });
};
