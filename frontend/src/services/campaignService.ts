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
  const url = workspaceId ? `/campaigns?workspaceId=${workspaceId}` : '/campaigns';
  return apiCall(url);
};

export const createCampaign = async (data: any): Promise<any> => {
  return apiCall('/campaigns', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateCampaignStatus = async (id: string, status: string): Promise<any> => {
  return apiCall(`/campaigns/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

export const duplicateCampaign = async (id: string): Promise<any> => {
  return apiCall(`/campaigns/duplicate/${id}`, {
    method: 'POST'
  });
};

export const bulkUpdateStatus = async (ids: string[], status: string): Promise<any> => {
  return apiCall('/campaigns/bulk-status', {
    method: 'PATCH',
    body: JSON.stringify({ ids, status })
  });
};

export const getCampaignTemplates = async (): Promise<any[]> => {
  return apiCall('/campaigns/templates');
};
