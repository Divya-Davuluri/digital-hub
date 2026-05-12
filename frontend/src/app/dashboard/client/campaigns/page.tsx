'use client';

import { useState, useEffect } from 'react';
import apiCall from '@/lib/api';

export default function ClientCampaigns() {
  const [campaigns, setCampaigns] = 
    useState<any[]>([]);
  const [loading, setLoading] = 
    useState<boolean>(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await apiCall(
        '/campaigns'
      );
      setCampaigns(Array.isArray(data) ? data : (data.campaigns || []));
    } catch (err) {
      console.error('Load campaigns:', err);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = (
    campaignName: string
  ) => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html><head>
          <title>${campaignName}</title>
          <style>
            body { font-family: Arial;
              padding: 40px; }
            h1 { color: #4f46e5; }
            .row { display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #eee; }
          </style>
        </head>
        <body>
          <h1>Campaign Report</h1>
          <div class="row">
            <span>Campaign</span>
            <strong>${campaignName}</strong>
          </div>
          <div class="row">
            <span>Generated</span>
            <span>${new Date()
              .toLocaleDateString()}</span>
          </div>
          <div class="row">
            <span>Status</span>
            <span>ACTIVE</span>
          </div>
        </body></html>
      `);
      win.document.close();
      win.print();
    }
  };

  return (
    <div style={{
      padding: '32px',
      background: '#f9fafb',
      minHeight: '100vh'
    }}>
      <h1 style={{
        fontSize: '26px',
        fontWeight: '700',
        margin: '0 0 8px',
        color: '#111827'
      }}>
        Campaign Portfolio
      </h1>
      <p style={{
        color: '#6b7280',
        margin: '0 0 24px',
        fontSize: '14px'
      }}>
        View all your active campaigns 
        and performance reports.
      </p>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{
              background: '#f9fafb'
            }}>
              {[
                'CAMPAIGN', 'BUDGET',
                'STATUS', 'REPORTS'
              ].map(h => (
                <th key={h} style={{
                  padding: '12px 20px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  letterSpacing: '0.05em',
                  borderBottom: 
                    '1px solid #e5e7eb'
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  Loading campaigns...
                </td>
              </tr>
            ) : !Array.isArray(campaigns) || campaigns.length === 0 ? (
              <tr>
                <td colSpan={4} style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  No campaigns found
                </td>
              </tr>
            ) : (
              campaigns.map((c: any) => (
                <tr key={c.id} style={{
                  borderBottom: 
                    '1px solid #f3f4f6'
                }}>
                  <td style={{
                    padding: '16px 20px',
                    fontWeight: '500',
                    color: '#111827'
                  }}>
                    {c.name}
                  </td>
                  <td style={{
                    padding: '16px 20px',
                    color: '#111827'
                  }}>
                    ${(c.budget || 0)
                      .toLocaleString()}
                  </td>
                  <td style={{
                    padding: '16px 20px'
                  }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: '#d1fae5',
                      color: '#065f46'
                    }}>
                      {c.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td style={{
                    padding: '16px 20px'
                  }}>
                    <button
                      onClick={() =>
                        downloadPDF(c.name)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#4f46e5',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Download PDF
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
