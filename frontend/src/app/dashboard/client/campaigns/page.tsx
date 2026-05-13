'use client';

import { useState, useEffect } from 'react';
import apiCall from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function ClientCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState({
    totalSpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0
  });

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/client/campaigns');
      if (data.success) {
        setCampaigns(data.campaigns || []);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch (err) {
      console.error('Load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadCampaigns();
  }, [user]);

  const downloadPDF = (campaign: any) => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html><head>
          <title>${campaign.name} Report</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1f2937; }
            h1 { color: #4f46e5; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
            .stat { background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .stat-label { font-size: 12px; color: #6b7280; font-weight: bold; }
            .stat-value { font-size: 20px; font-weight: bold; margin-top: 5px; }
            .footer { margin-top: 50px; font-size: 12px; color: #9ca3af; text-align: center; }
          </style>
        </head>
        <body>
          <h1>Campaign Performance: ${campaign.name}</h1>
          <p>Generated: ${new Date().toLocaleDateString()}</p>
          <div class="grid">
            <div class="stat"><div class="stat-label">Budget</div><div class="stat-value">$${Number(campaign.budget).toLocaleString()}</div></div>
            <div class="stat"><div class="stat-label">Spent</div><div class="stat-value">$${Number(campaign.spent).toLocaleString()}</div></div>
            <div class="stat"><div class="stat-label">Impressions</div><div class="stat-value">${Number(campaign.impressions).toLocaleString()}</div></div>
            <div class="stat"><div class="stat-label">Clicks</div><div class="stat-value">${Number(campaign.clicks).toLocaleString()}</div></div>
            <div class="stat"><div class="stat-label">Conversions</div><div class="stat-value">${Number(campaign.conversions).toLocaleString()}</div></div>
            <div class="stat"><div class="stat-label">CTR</div><div class="stat-value">${campaign.ctr}%</div></div>
          </div>
          <div class="footer">Digital Marketing Hub - Performance Summary</div>
        </body></html>
      `);
      win.document.close();
      win.print();
    }
  };

  return (
    <div style={{ padding: '32px', background: '#ffffff', minHeight: '100vh' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', margin: '0 0 8px' }}>
          Campaign Portfolio
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          Real-time performance tracking for all your marketing initiatives.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
        <KpiCard label="Total Spend" value={`$${metrics.totalSpend.toLocaleString()}`} icon="💰" />
        <KpiCard label="Impressions" value={metrics.totalImpressions.toLocaleString()} icon="👁️" />
        <KpiCard label="Clicks" value={metrics.totalClicks.toLocaleString()} icon="🖱️" />
        <KpiCard label="Conversions" value={metrics.totalConversions.toLocaleString()} icon="🎯" />
      </div>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['CAMPAIGN', 'PLATFORM', 'BUDGET', 'SPENT', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f3f4f6' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                  Synchronizing performance data...
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                  No campaigns found for your workspace.
                </td>
              </tr>
            ) : (
              campaigns.map((c: any) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '20px 24px', fontWeight: '600', color: '#111827' }}>{c.name}</td>
                  <td style={{ padding: '20px 24px' }}>
                    <span style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: '800', color: '#6366f1' }}>{c.platform || 'Google Ads'}</span>
                  </td>
                  <td style={{ padding: '20px 24px', color: '#374151' }}>${Number(c.budget).toLocaleString()}</td>
                  <td style={{ padding: '20px 24px', color: '#374151', fontWeight: '600' }}>${Number(c.spent).toLocaleString()}</td>
                  <td style={{ padding: '20px 24px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: c.status?.toLowerCase() === 'active' ? '#ecfdf5' : '#fef2f2', color: c.status?.toLowerCase() === 'active' ? '#059669' : '#dc2626' }}>
                      {c.status?.toUpperCase() || 'ACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <button
                      onClick={() => downloadPDF(c)}
                      style={{ background: '#f3f4f6', border: 'none', color: '#4b5563', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                    >
                      Download Report
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon }: any) {
  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #f3f4f6', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize: '24px', marginBottom: '12px' }}>{icon}</div>
      <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.025em' }}>{label}</p>
      <h2 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '800', color: '#111827' }}>{value}</h2>
    </div>
  );
}
