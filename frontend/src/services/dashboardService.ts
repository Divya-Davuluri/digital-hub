import { apiFetch } from '@/lib/api';

export interface DashboardSummary {
  totalSpend: number;
  totalConversions: number;
  totalImpressions: number;
  totalClicks: number;
  avgRoas: number;
  clientCount: number;
  activeCampaigns: number;
}

export interface ChannelStat {
  channel: string;
  spend: number;
  conversions: number;
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  return apiFetch('/dashboard/summary');
};

export const getDashboardStats = async (): Promise<ChannelStat[]> => {
  return apiFetch('/dashboard/stats');
};

export const exportReport = async (format: 'csv' | 'pdf') => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/export?format=${format}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Export failed');

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report-${new Date().toISOString().split('T')[0]}.${format}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
