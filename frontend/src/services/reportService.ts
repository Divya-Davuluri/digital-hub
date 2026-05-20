import apiCall from '@/lib/api';

export interface ReportRequest {
  id: string;
  reportType: string;
  dateFrom?: string;
  dateTo?: string;
  notes?: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
  clientName?: string;
}

export const getReportRequests = async (workspaceId?: string): Promise<ReportRequest[]> => {
  const url = workspaceId ? `/reports/requests?workspaceId=${workspaceId}` : '/reports/requests';
  return apiCall(url);
};

export const requestCustomReport = async (data: any): Promise<any> => {
  return apiCall('/reports/request', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const exportReportPDF = async (workspaceId?: string): Promise<void> => {
  const token = localStorage.getItem('token');
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://digital-hub-og1a.onrender.com';
  
  const url = workspaceId 
    ? `${baseUrl}/api/reports/client-pdf?workspaceId=${workspaceId}` 
    : `${baseUrl}/api/reports/client-pdf`;
    
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Export failed');

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `report-${Date.now()}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
  document.body.removeChild(a);
};
export const getReports = async (workspaceId?: string): Promise<any[]> => {
  const url = workspaceId ? `/reports?workspaceId=${workspaceId}` : '/reports';
  return apiCall(url);
};

export const downloadReport = async (reportUrl: string): Promise<void> => {
  const token = localStorage.getItem('token');
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://digital-hub-og1a.onrender.com';
  
  // Handle relative URLs
  const url = reportUrl.startsWith('http') ? reportUrl : `${baseUrl}${reportUrl.startsWith('/') ? '' : '/'}${reportUrl}`;
    
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Download failed');

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `report-${Date.now()}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
  document.body.removeChild(a);
};
