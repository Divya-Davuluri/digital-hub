import apiCall from '@/lib/api';

export interface Campaign {
  id: string;
  name: string;
  clientId?: string;
  clientName?: string;
  budget: number;
  spent: number;
  channel: string;
  platform?: string;
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr?: number;
  headline?: string;
  cta?: string;
  creativeUrl?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export const getCampaigns = async (workspaceId?: string): Promise<Campaign[]> => {
  const url = workspaceId ? `/campaigns?workspaceId=${workspaceId}` : '/campaigns';
  const data = await apiCall(url);
  return data.campaigns || [];
};

export const getCampaignById = async (id: string): Promise<Campaign> => {
  const data = await apiCall(`/campaigns/${id}`);
  return data.campaign;
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
