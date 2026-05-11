import apiCall from '@/lib/api';

export interface BrandingSettings {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  subdomain?: string;
}

export const getBranding = async (): Promise<BrandingSettings> => {
  return apiCall('/admin/branding');
};

export const updateBranding = async (settings: BrandingSettings): Promise<void> => {
  return apiCall('/admin/branding', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
};
