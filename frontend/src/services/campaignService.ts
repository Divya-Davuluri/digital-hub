import apiCall from '@/lib/api';

export interface Campaign {
  id: string;
  name: string;
  clientId?: string;
  clientName?: string;
  budget: number;
  channel: 'google' | 'facebook' | 'instagram' | 'linkedin' | 'tiktok';
  status: 'active' | 'paused' | 'completed' | 'review';
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export const getCampaigns = async (workspaceId?: string): Promise<Campaign[]> => {
  const url = workspaceId ? `/agency/campaigns?workspaceId=${workspaceId}` : '/agency/campaigns';
  return apiCall(url);
};

export const updateCampaignStatus = async (id: string, status: string): Promise<any> => {
  return apiCall(`/agency/campaigns/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};
