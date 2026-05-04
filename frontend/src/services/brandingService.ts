import { apiFetch } from '@/lib/api';

export interface BrandingSettings {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  subdomain?: string;
}

export const getBranding = async (): Promise<BrandingSettings> => {
  return apiFetch('/admin/branding');
};

export const updateBranding = async (settings: BrandingSettings): Promise<void> => {
  return apiFetch('/admin/branding', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
};
