'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

interface Task {
  id: string;
  title: string;
  client_name: string;
  priority: string;
  status: string;
  due_date: string;
  created_at: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = 
    useState<Task[]>([]);
  const [loading, setLoading] = 
    useState<boolean>(true);
  const [showModal, setShowModal] = 
    useState<boolean>(false);
  const [taskTitle, setTaskTitle] = 
    useState<string>('');
  const [clientName, setClientName] = 
    useState<string>('');
  const [priority, setPriority] = 
    useState<string>('MEDIUM');
  const [creating, setCreating] = 
    useState<boolean>(false);
  const [modalError, setModalError] = 
    useState<string>('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const getToken = (): string => {
    if (typeof window === 'undefined') 
      return '';
    return localStorage.getItem('token') ||
      sessionStorage.getItem('token') || '';
  };

  const fetchTasks = async (): 
    Promise<void> => {
    try {
      setLoading(true);
      const data = await apiFetch('/team/tasks');
      setTasks(data.tasks || []);
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Fetch tasks:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (): 
    Promise<void> => {
    if (!taskTitle.trim()) {
      setModalError('Task title is required');
      return;
    }

    try {
      setCreating(true);
      setModalError('');

      const priorityMap: 
        Record<string, string> = {
        'High Priority': 'HIGH',
        'Medium Priority': 'MEDIUM',
        'Low Priority': 'LOW',
        'HIGH': 'HIGH',
        'MEDIUM': 'MEDIUM',
        'LOW': 'LOW'
      };

      const data = await apiFetch('/team/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: taskTitle.trim(),
          clientName: clientName.trim(),
          priority: priorityMap[priority] || 'MEDIUM'
        })
      });

      if (!data || !data.success) {
        throw new Error(
          data?.error || 
          'Failed to create task'
        );
      }

      setTasks((prev: Task[]) => 
        [data.task as Task, ...prev]);
      setShowModal(false);
      setTaskTitle('');
      setClientName('');
      setPriority('MEDIUM');

    } catch (err: unknown) {
      const error = err as Error;
      setModalError(
        error.message || 
        'Failed to create task'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleComplete = async (
    id: string
  ): Promise<void> => {
    try {
      await apiFetch(`/team/tasks/${id}/complete`, {
        method: 'PATCH'
      });
      setTasks((prev: Task[]) =>
        prev.filter(
          (t: Task) => t.id !== id
        )
      );
    } catch (err) {
      console.error('Complete task:', err);
    }
  };

  const getPriorityStyle = (
    p: string
  ): { bg: string; color: string } => {
    if (p === 'HIGH') return {
      bg: '#fee2e2', color: '#991b1b'
    };
    if (p === 'LOW') return {
      bg: '#d1fae5', color: '#065f46'
    };
    return { 
      bg: '#fef3c7', color: '#92400e' 
    };
  };

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
            Task Management
          </h1>
          <p style={{
            color: '#6b7280',
            margin: 0,
            fontSize: '14px'
          }}>
            Track approvals, report generation,
            and campaign status updates.
          </p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setModalError('');
            setTaskTitle('');
            setClientName('');
            setPriority('MEDIUM');
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
          + Create New Task
        </button>
      </div>

      {/* Tasks Card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '15px',
            fontWeight: '600',
            color: '#111827'
          }}>
            Active Tasks
          </h2>
          <span style={{
            padding: '4px 12px',
            background: '#f3f4f6',
            borderRadius: '20px',
            fontSize: '12px',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            Status: Pending
          </span>
        </div>

        {loading ? (
          <div style={{
            padding: '60px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div style={{
            padding: '60px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>📋</div>
            <h3 style={{
              margin: '0 0 8px',
              color: '#111827',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              No Active Tasks
            </h3>
            <p style={{
              color: '#6b7280',
              margin: 0,
              fontSize: '14px'
            }}>
              Click "+ Create New Task" 
              to add your first task
            </p>
          </div>
        ) : (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{
                background: '#f9fafb'
              }}>
                {[
                  'TASK', 'CLIENT',
                  'PRIORITY', 'STATUS',
                  'ACTION'
                ].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px',
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
              {tasks.map((task: Task) => {
                const ps = getPriorityStyle(
                  task.priority
                );
                return (
                  <tr
                    key={task.id}
                    style={{
                      borderBottom:
                        '1px solid #f3f4f6'
                    }}
                  >
                    <td style={{
                      padding: '14px 16px',
                      fontWeight: '500',
                      fontSize: '14px',
                      color: '#111827'
                    }}>
                      {task.title}
                    </td>
                    <td style={{
                      padding: '14px 16px',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      {task.client_name || 
                       '-'}
                    </td>
                    <td style={{
                      padding: '14px 16px'
                    }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: ps.bg,
                        color: ps.color
                      }}>
                        {task.priority || 
                         'MEDIUM'}
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
                        background: '#fef3c7',
                        color: '#92400e'
                      }}>
                        {task.status || 
                         'PENDING'}
                      </span>
                    </td>
                    <td style={{
                      padding: '14px 16px'
                    }}>
                      <button
                        onClick={() =>
                          handleComplete(
                            task.id
                          )
                        }
                        style={{
                          padding: '6px 14px',
                          background: '#4f46e5',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        ✓ Complete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Task Modal */}
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
            setShowModal(false)
          }
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '28px',
              width: '440px',
              maxWidth: '90vw'
            }}
            onClick={e =>
              e.stopPropagation()
            }
          >
            {/* Modal Header */}
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
                Create New Task
              </h2>
              <button
                onClick={() =>
                  setShowModal(false)
                }
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '22px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Error */}
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

            {/* Task Title */}
            <div style={{
              marginBottom: '16px'
            }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Task Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Review Q2 Report"
                value={taskTitle}
                onChange={e =>
                  setTaskTitle(
                    e.target.value
                  )
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            {/* Client Name */}
            <div style={{
              marginBottom: '16px'
            }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Client Name
              </label>
              <input
                type="text"
                placeholder="e.g. Nike Marketing"
                value={clientName}
                onChange={e =>
                  setClientName(
                    e.target.value
                  )
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            {/* Priority */}
            <div style={{
              marginBottom: '24px'
            }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Priority Level
              </label>
              <select
                value={priority}
                onChange={e =>
                  setPriority(
                    e.target.value
                  )
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="HIGH">
                  High Priority
                </option>
                <option value="MEDIUM">
                  Medium Priority
                </option>
                <option value="LOW">
                  Low Priority
                </option>
              </select>
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() =>
                  setShowModal(false)
                }
                style={{
                  flex: 1,
                  padding: '11px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#374151',
                  fontWeight: '500'
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
                  : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
