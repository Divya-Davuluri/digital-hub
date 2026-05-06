'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalSpend: 0,
    conversions: 0,
    avgRoas: 0,
    activeCampaigns: 0
  });

  return (
    <div style={{ padding: '32px' }}>
      
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 8px',
            color: '#111827'
          }}>
            Admin Dashboard
          </h1>
          <p style={{
            color: '#6b7280',
            margin: 0,
            fontSize: '15px'
          }}>
            Overview of all client performance 
            and agency health.
          </p>
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '12px' 
        }}>
          <button
            onClick={() => {}}
            style={{
              padding: '10px 20px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ↓ Export CSV
          </button>
          <button
            onClick={() => {}}
            style={{
              padding: '10px 20px',
              background: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ⬇ Export PDF
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 
          'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {[
          {
            label: 'Total Spend',
            value: '$0',
            change: '+12.5%',
            positive: true
          },
          {
            label: 'Conversions',
            value: '0',
            change: '+8.2%',
            positive: true
          },
          {
            label: 'Avg ROAS',
            value: '0.00x',
            change: '+4.1%',
            positive: true
          },
          {
            label: 'Active Campaigns',
            value: '0',
            change: 'Steady',
            positive: true
          }
        ].map((metric, i) => (
          <div
            key={i}
            onClick={() => 
              router.push('/reports')}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s'
            }}
          >
            <p style={{
              fontSize: '13px',
              color: '#6b7280',
              margin: '0 0 8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '500'
            }}>
              {metric.label}
            </p>
            <p style={{
              fontSize: '28px',
              fontWeight: '700',
              margin: '0 0 8px',
              color: '#111827'
            }}>
              {metric.value}
            </p>
            <span style={{
              fontSize: '13px',
              color: metric.positive 
                ? '#10b981' : '#ef4444',
              fontWeight: '500'
            }}>
              {metric.positive ? '▲' : '▼'} 
              {metric.change}
            </span>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        
        {/* Channel Performance */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '600',
            margin: '0 0 20px',
            color: '#111827'
          }}>
            Channel Performance
          </h2>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: '#9ca3af',
            fontSize: '14px'
          }}>
            <div style={{ 
              fontSize: '40px',
              marginBottom: '12px'
            }}>📊</div>
            No campaign data yet.
            Connect ad platforms to 
            see performance.
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '600',
            margin: '0 0 20px',
            color: '#111827'
          }}>
            Quick Actions
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            {[
              {
                icon: '👤',
                label: 'Add Client',
                path: '/dashboard/admin/clients'
              },
              {
                icon: '🎨',
                label: 'Branding',
                path: '/dashboard/admin/branding'
              },
              {
                icon: '🚀',
                label: 'Campaigns',
                path: '/dashboard/admin/campaigns'
              },
              {
                icon: '⚙️',
                label: 'Settings',
                path: '/dashboard/admin/settings'
              }
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => 
                  router.push(action.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  gap: '8px',
                  transition: 
                    'background 0.2s'
                }}
              >
                <span style={{ 
                  fontSize: '28px' 
                }}>
                  {action.icon}
                </span>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

