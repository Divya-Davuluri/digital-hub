'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Campaign {
  id: string;
  name: string;
  client_name: string;
  status: string;
  budget: number;
  spent: number;
  platform: string;
  impressions: number;
  clicks: number;
  conversions: number;
  created_at: string;
}

export default function AdminCampaigns() {
  const router = useRouter();
  const [campaigns, setCampaigns] = 
    useState<Campaign[]>([]);
  const [loading, setLoading] = 
    useState<boolean>(true);
  const [showModal, setShowModal] = 
    useState<boolean>(false);
  const [creating, setCreating] = 
    useState<boolean>(false);
  const [error, setError] = 
    useState<string>('');
  const [modalError, setModalError] = 
    useState<string>('');
  const [searchTerm, setSearchTerm] = 
    useState<string>('');
  const [filterStatus, setFilterStatus] = 
    useState<string>('ALL');

  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    budget: '',
    platform: 'Meta',
    status: 'ACTIVE',
    startDate: '',
    endDate: ''
  });

  const getToken = (): string => {
    if (typeof window === 'undefined')
      return '';
    return (
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      ''
    );
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(
        '/api/admin/campaigns',
        {
          headers: {
            Authorization: 
              `Bearer ${getToken()}`
          }
        }
      );
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err: any) {
      setError(
        'Failed to load campaigns'
      );
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setModalError(
        'Campaign name is required'
      );
      return;
    }
    try {
      setCreating(true);
      setModalError('');
      const res = await fetch(
        '/api/admin/campaigns',
        {
          method: 'POST',
          headers: {
            Authorization:
              `Bearer ${getToken()}`,
            'Content-Type': 
              'application/json'
          },
          body: JSON.stringify({
            name: formData.name,
            clientName: formData.clientName,
            budget: formData.budget,
            platform: formData.platform,
            status: formData.status,
            startDate: formData.startDate,
            endDate: formData.endDate
          })
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error || 
          'Failed to create campaign'
        );
      }
      setCampaigns((prev: Campaign[]) =>
        [data.campaign, ...prev]);
      setShowModal(false);
      setFormData({
        name: '', clientName: '',
        budget: '', platform: 'Meta',
        status: 'ACTIVE',
        startDate: '', endDate: ''
      });
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (
    id: string,
    newStatus: string
  ) => {
    try {
      await fetch(
        `/api/admin/campaigns/${id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization:
              `Bearer ${getToken()}`,
            'Content-Type': 
              'application/json'
          },
          body: JSON.stringify({
            status: newStatus
          })
        }
      );
      setCampaigns((prev: Campaign[]) =>
        prev.map((c: Campaign) =>
          c.id === id
            ? { ...c, status: newStatus }
            : c
        )
      );
    } catch (err) {
      console.error('Status change:', err);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return {
          bg: '#d1fae5',
          color: '#065f46'
        };
      case 'PAUSED':
        return {
          bg: '#fef3c7',
          color: '#92400e'
        };
      case 'COMPLETED':
        return {
          bg: '#f3f4f6',
          color: '#6b7280'
        };
      default:
        return {
          bg: '#dbeafe',
          color: '#1e40af'
        };
    }
  };

  const filteredCampaigns = campaigns
    .filter((c: Campaign) => {
      const matchSearch = 
        c.name?.toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          ) ||
        c.client_name?.toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          );
      const matchStatus = 
        filterStatus === 'ALL' ||
        c.status === filterStatus;
      return matchSearch && matchStatus;
    });

  const totalBudget = campaigns.reduce(
    (sum: number, c: Campaign) =>
      sum + (c.budget || 0), 0
  );
  const totalSpent = campaigns.reduce(
    (sum: number, c: Campaign) =>
      sum + (c.spent || 0), 0
  );
  const activeCampaigns = campaigns
    .filter((c: Campaign) =>
      c.status === 'ACTIVE'
    ).length;
  const totalConversions = campaigns
    .reduce(
      (sum: number, c: Campaign) =>
        sum + (c.conversions || 0), 0
    );

  return (
    <div style={{
      padding: '32px',
      background: '#f9fafb',
      minHeight: '100vh'
    }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{
            fontSize: '26px',
            fontWeight: '700',
            margin: '0 0 6px',
            color: '#111827'
          }}>
            Campaign Management
          </h1>
          <p style={{
            color: '#6b7280',
            margin: 0,
            fontSize: '14px'
          }}>
            Create and manage campaigns 
            across all channels.
          </p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setModalError('');
          }}
          style={{
            padding: '10px 20px',
            background: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          + Create Campaign
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 
          'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {[
          {
            label: 'Total Budget',
            value: `$${totalBudget
              .toLocaleString()}`,
            color: '#4f46e5'
          },
          {
            label: 'Total Spent',
            value: `$${totalSpent
              .toLocaleString()}`,
            color: '#10b981'
          },
          {
            label: 'Active Campaigns',
            value: activeCampaigns
              .toString(),
            color: '#f59e0b'
          },
          {
            label: 'Total Conversions',
            value: totalConversions
              .toString(),
            color: '#6366f1'
          }
        ].map((card, i) => (
          <div key={i} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              margin: '0 0 8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '500'
            }}>
              {card.label}
            </p>
            <p style={{
              fontSize: '26px',
              fontWeight: '700',
              margin: 0,
              color: card.color
            }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <input
          type="text"
          placeholder="Search campaigns..."
          value={searchTerm}
          onChange={e =>
            setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            background: 'white'
          }}
        />
        <select
          value={filterStatus}
          onChange={e =>
            setFilterStatus(e.target.value)}
          style={{
            padding: '10px 14px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            background: 'white',
            cursor: 'pointer'
          }}
        >
          <option value="ALL">
            All Status
          </option>
          <option value="ACTIVE">
            Active
          </option>
          <option value="PAUSED">
            Paused
          </option>
          <option value="COMPLETED">
            Completed
          </option>
        </select>
        <button
          onClick={fetchCampaigns}
          style={{
            padding: '10px 16px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151'
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Campaigns Table */}
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
                'CAMPAIGN', 'CLIENT',
                'PLATFORM', 'STATUS',
                'BUDGET', 'SPENT',
                'IMPRESSIONS', 'CONVERSIONS',
                'ACTIONS'
              ].map(h => (
                <th key={h} style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#6b7280',
                  letterSpacing: '0.05em',
                  borderBottom: 
                    '1px solid #e5e7eb',
                  whiteSpace: 'nowrap'
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{
                  padding: '60px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  Loading campaigns...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={9} style={{
                  padding: '40px',
                  textAlign: 'center'
                }}>
                  <p style={{
                    color: '#ef4444',
                    marginBottom: '12px'
                  }}>
                    {error}
                  </p>
                  <button
                    onClick={fetchCampaigns}
                    style={{
                      padding: '8px 16px',
                      background: '#4f46e5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ) : filteredCampaigns
                .length === 0 ? (
              <tr>
                <td colSpan={9} style={{
                  padding: '60px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '40px',
                    marginBottom: '12px'
                  }}>
                    🚀
                  </div>
                  <h3 style={{
                    margin: '0 0 8px',
                    color: '#111827',
                    fontSize: '16px'
                  }}>
                    No Campaigns Yet
                  </h3>
                  <p style={{
                    color: '#6b7280',
                    margin: '0 0 16px',
                    fontSize: '14px'
                  }}>
                    Create your first campaign
                    to get started
                  </p>
                  <button
                    onClick={() =>
                      setShowModal(true)}
                    style={{
                      padding: '8px 20px',
                      background: '#4f46e5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    + Create Campaign
                  </button>
                </td>
              </tr>
            ) : (
              filteredCampaigns.map(
                (campaign: Campaign) => {
                const ss = getStatusStyle(
                  campaign.status
                );
                const ctr = campaign
                  .impressions > 0
                  ? ((campaign.clicks /
                    campaign.impressions)
                    * 100).toFixed(2)
                  : '0.00';

                return (
                  <tr
                    key={campaign.id}
                    style={{
                      borderBottom:
                        '1px solid #f3f4f6',
                      transition:
                        'background 0.1s'
                    }}
                  >
                    <td style={{
                      padding: '14px 16px',
                      fontWeight: '500',
                      color: '#111827',
                      fontSize: '14px',
                      maxWidth: '200px'
                    }}>
                      {campaign.name}
                    </td>
                    <td style={{
                      padding: '14px 16px',
                      color: '#6b7280',
                      fontSize: '13px'
                    }}>
                      {campaign.client_name
                        || '—'}
                    </td>
                    <td style={{
                      padding: '14px 16px'
                    }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: '#ede9fe',
                        color: '#5b21b6'
                      }}>
                        {campaign.platform
                          || 'Meta'}
                      </span>
                    </td>
                    <td style={{
                      padding: '14px 16px'
                    }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: ss.bg,
                        color: ss.color
                      }}>
                        {campaign.status}
                      </span>
                    </td>
                    <td style={{
                      padding: '14px 16px',
                      color: '#111827',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      ${(campaign.budget || 0)
                        .toLocaleString()}
                    </td>
                    <td style={{
                      padding: '14px 16px',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      ${(campaign.spent || 0)
                        .toLocaleString()}
                    </td>
                    <td style={{
                      padding: '14px 16px',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      {(campaign.impressions
                        || 0).toLocaleString()}
                    </td>
                    <td style={{
                      padding: '14px 16px',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      {campaign.conversions
                        || 0}
                    </td>
                    <td style={{
                      padding: '14px 16px'
                    }}>
                      <div style={{
                        display: 'flex',
                        gap: '8px'
                      }}>
                        {campaign.status
                          === 'ACTIVE' ? (
                          <button
                            onClick={() =>
                              handleStatusChange(
                                campaign.id,
                                'PAUSED'
                              )}
                            style={{
                              padding:
                                '5px 10px',
                              background:
                                '#fef3c7',
                              color: '#92400e',
                              border: 'none',
                              borderRadius:
                                '6px',
                              cursor:
                                'pointer',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            Pause
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleStatusChange(
                                campaign.id,
                                'ACTIVE'
                              )}
                            style={{
                              padding:
                                '5px 10px',
                              background:
                                '#d1fae5',
                              color: '#065f46',
                              border: 'none',
                              borderRadius:
                                '6px',
                              cursor:
                                'pointer',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            Resume
                          </button>
                        )}
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/admin/campaigns/${campaign.id}`
                            )}
                          style={{
                            padding:
                              '5px 10px',
                            background:
                              '#ede9fe',
                            color: '#5b21b6',
                            border: 'none',
                            borderRadius:
                              '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Campaign Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0,
            right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() =>
            setShowModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '28px',
              width: '500px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={e =>
              e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827'
              }}>
                Create New Campaign
              </h2>
              <button
                onClick={() =>
                  setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '22px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            {modalError && (
              <div style={{
                padding: '10px 14px',
                background: '#fee2e2',
                color: '#991b1b',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                ⚠️ {modalError}
              </div>
            )}

            {[
              {
                label: 'Campaign Name *',
                key: 'name',
                type: 'text',
                placeholder:
                  'e.g. Summer Sale 2026'
              },
              {
                label: 'Client Name',
                key: 'clientName',
                type: 'text',
                placeholder:
                  'e.g. Nike Marketing'
              },
              {
                label: 'Total Budget ($)',
                key: 'budget',
                type: 'number',
                placeholder: 'e.g. 5000'
              },
              {
                label: 'Start Date',
                key: 'startDate',
                type: 'date',
                placeholder: ''
              },
              {
                label: 'End Date',
                key: 'endDate',
                type: 'date',
                placeholder: ''
              }
            ].map(field => (
              <div
                key={field.key}
                style={{
                  marginBottom: '16px'
                }}
              >
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  placeholder={
                    field.placeholder
                  }
                  value={
                    formData[
                      field.key as
                        keyof typeof formData
                    ]
                  }
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      [field.key]:
                        e.target.value
                    }))
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border:
                      '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            ))}

            <div style={{
              marginBottom: '16px'
            }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Platform
              </label>
              <select
                value={formData.platform}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    platform: e.target.value
                  }))
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border:
                    '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="Meta">
                  Meta (Facebook/Instagram)
                </option>
                <option value="Google">
                  Google Ads
                </option>
                <option value="TikTok">
                  TikTok Ads
                </option>
                <option value="LinkedIn">
                  LinkedIn Ads
                </option>
                <option value="Twitter">
                  Twitter/X Ads
                </option>
                <option value="Snapchat">
                  Snapchat Ads
                </option>
              </select>
            </div>

            <div style={{
              marginBottom: '24px'
            }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Initial Status
              </label>
              <select
                value={formData.status}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    status: e.target.value
                  }))
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border:
                    '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="ACTIVE">
                  Active
                </option>
                <option value="PAUSED">
                  Paused
                </option>
                <option value="DRAFT">
                  Draft
                </option>
              </select>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() =>
                  setShowModal(false)}
                style={{
                  flex: 1,
                  padding: '11px',
                  border:
                    '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#374151'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  flex: 1,
                  padding: '11px',
                  background: creating
                    ? '#9ca3af'
                    : '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: creating
                    ? 'not-allowed'
                    : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {creating
                  ? 'Creating...'
                  : 'Create Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
