'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/projects/${projectId}`);
      setProject(data.project);
      setProject(data.project);

    } catch (err: any) {
      setError(err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'COMPLETED': 
        return { bg: '#d1fae5', color: '#065f46' };
      case 'IN PROGRESS': 
        return { bg: '#dbeafe', color: '#1e40af' };
      case 'PLANNING': 
        return { bg: '#fef3c7', color: '#92400e' };
      default: 
        return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  if (loading) return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '400px',
      fontSize: '16px',
      color: '#6b7280'
    }}>
      Loading project details...
    </div>
  );

  if (error || !project) return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '400px',
      gap: '16px'
    }}>
      <h2 style={{ color: '#ef4444' }}>
        Project not found
      </h2>
      <button
        onClick={() => router.push('/projects')}
        style={{
          padding: '10px 24px',
          background: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Back to Projects
      </button>
    </div>
  );

  const statusStyle = getStatusColor(project.status);

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      
      {/* Back button */}
      <button
        onClick={() => router.push('/projects')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: '#4f46e5',
          cursor: 'pointer',
          fontSize: '14px',
          marginBottom: '24px',
          padding: '0'
        }}
      >
        ← Back to Projects
      </button>

      {/* Project Header */}
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
            textTransform: 'capitalize'
          }}>
            {project.name}
          </h1>
          <p style={{
            color: '#6b7280',
            margin: '0',
            fontSize: '15px'
          }}>
            {project.client_name || 
             project.clientName || 
             'No client assigned'}
          </p>
        </div>
        <span style={{
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: '500',
          background: statusStyle.bg,
          color: statusStyle.color
        }}>
          {project.status || 'PLANNING'}
        </span>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: '#f9fafb',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#6b7280',
            margin: '0 0 8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Completion
          </p>
          <p style={{
            fontSize: '28px',
            fontWeight: '700',
            margin: '0',
            color: '#4f46e5'
          }}>
            {project.completion || 0}%
          </p>
          <div style={{
            height: '6px',
            background: '#e5e7eb',
            borderRadius: '3px',
            marginTop: '8px'
          }}>
            <div style={{
              height: '100%',
              width: `${project.completion || 0}%`,
              background: '#4f46e5',
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>

        <div style={{
          background: '#f9fafb',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#6b7280',
            margin: '0 0 8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Due Date
          </p>
          <p style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: '0',
            color: '#111827'
          }}>
            {project.due_date || project.target_date
              ? new Date(project.due_date || project.target_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : 'Not set'
            }
          </p>
        </div>

        <div style={{
          background: '#f9fafb',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#6b7280',
            margin: '0 0 8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Created
          </p>
          <p style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: '0',
            color: '#111827'
          }}>
            {project.created_at
              ? new Date(project.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : 'N/A'
            }
          </p>
        </div>
      </div>

      {/* Project Details */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h2 style={{
          fontSize: '16px',
          fontWeight: '600',
          margin: '0 0 20px',
          color: '#111827'
        }}>
          Project Details
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px'
        }}>
          <div>
            <p style={{
              fontSize: '13px',
              color: '#6b7280',
              margin: '0 0 4px'
            }}>Project Name</p>
            <p style={{
              fontSize: '15px',
              fontWeight: '500',
              margin: '0',
              textTransform: 'capitalize'
            }}>{project.name}</p>
          </div>

          <div>
            <p style={{
              fontSize: '13px',
              color: '#6b7280',
              margin: '0 0 4px'
            }}>Client</p>
            <p style={{
              fontSize: '15px',
              fontWeight: '500',
              margin: '0'
            }}>
              {project.client_name || 
               project.clientName || 
               'No client assigned'}
            </p>
          </div>

          <div>
            <p style={{
              fontSize: '13px',
              color: '#6b7280',
              margin: '0 0 4px'
            }}>Status</p>
            <span style={{
              padding: '3px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              background: statusStyle.bg,
              color: statusStyle.color
            }}>
              {project.status || 'PLANNING'}
            </span>
          </div>

          <div>
            <p style={{
              fontSize: '13px',
              color: '#6b7280',
              margin: '0 0 4px'
            }}>Due Date</p>
            <p style={{
              fontSize: '15px',
              fontWeight: '500',
              margin: '0'
            }}>
              {project.due_date || 
               project.target_date || 
               'Not set'}
            </p>
          </div>
        </div>

        {project.description && (
          <div style={{ marginTop: '20px' }}>
            <p style={{
              fontSize: '13px',
              color: '#6b7280',
              margin: '0 0 4px'
            }}>Description</p>
            <p style={{
              fontSize: '15px',
              margin: '0',
              lineHeight: '1.6'
            }}>{project.description}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px'
      }}>
        <button
          onClick={() => router.push('/projects')}
          style={{
            padding: '10px 24px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151'
          }}
        >
          Back to Projects
        </button>
        <button
          onClick={() => {
            const newStatus = prompt(
              'Update status:\n1. PLANNING\n' +
              '2. IN PROGRESS\n3. COMPLETED',
              project.status
            );
            if (newStatus) {
              alert('Status update coming soon!');
            }
          }}
          style={{
            padding: '10px 24px',
            background: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Update Status
        </button>
      </div>
    </div>
  );
}
