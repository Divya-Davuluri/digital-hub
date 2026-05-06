'use client';

import { useState, useEffect } from 'react';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = 
    useState(false);
  const [taskTitle, setTaskTitle] = 
    useState('');
  const [clientName, setClientName] = 
    useState('');
  const [priority, setPriority] = 
    useState('MEDIUM');
  const [creating, setCreating] = 
    useState(false);
  const [modalError, setModalError] = 
    useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const getToken = () =>
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') || '';

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        '/api/team/tasks',
        {
          headers: {
            'Authorization': 
              `Bearer ${getToken()}`
          }
        }
      );
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Fetch tasks error:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      setModalError('');

      if (!taskTitle.trim()) {
        setModalError('Task title required');
        return;
      }

      const res = await fetch(
        '/api/team/tasks',
        {
          method: 'POST',
          headers: {
            'Authorization': 
              `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: taskTitle,
            clientName: clientName,
            priority: priority
          })
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || 'Failed to create task'
        );
      }

      setTasks((prev: any) => 
        [data.task, ...prev]);
      setShowModal(false);
      setTaskTitle('');
      setClientName('');
      setPriority('MEDIUM');

    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await fetch(
        `/api/team/tasks/${id}/complete`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': 
              `Bearer ${getToken()}`
          }
        }
      );
      setTasks((prev: any) =>
        prev.filter((t: any) => t.id !== id)
      );
    } catch (err) {
      console.error('Complete error:', err);
    }
  };

  const getPriorityStyle = (p: string) => {
    if (p === 'HIGH') return {
      bg: '#fee2e2', color: '#991b1b'
    };
    if (p === 'LOW') return {
      bg: '#d1fae5', color: '#065f46'
    };
    return { bg: '#fef3c7', color: '#92400e' };
  };

  return (
    <div style={{ padding: '32px' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '700',
            margin: '0 0 4px'
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
          onClick={() => setShowModal(true)}
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

      {/* Tasks Table */}
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
            fontSize: '16px',
            fontWeight: '600'
          }}>
            Active Tasks
          </h2>
          <span style={{
            padding: '4px 12px',
            background: '#f3f4f6',
            borderRadius: '20px',
            fontSize: '13px',
            color: '#6b7280'
          }}>
            Status: Pending
          </span>
        </div>

        {loading ? (
          <div style={{ 
            padding: '60px', 
            textAlign: 'center',
            color: '#6b7280' 
          }}>
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ 
            padding: '60px', 
            textAlign: 'center' 
          }}>
            <div style={{ 
              fontSize: '40px',
              marginBottom: '12px'
            }}>📋</div>
            <h3 style={{ 
              margin: '0 0 8px',
              color: '#111827'
            }}>
              No Active Tasks
            </h3>
            <p style={{ 
              color: '#6b7280',
              margin: 0,
              fontSize: '14px'
            }}>
              Click "+ Create New Task" to 
              add your first task
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
                {['TASK', 'CLIENT', 
                  'PRIORITY', 'STATUS', 
                  'ACTION'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    letterSpacing: '0.05em'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task: any) => {
                const ps = getPriorityStyle(
                  task.priority
                );
                return (
                  <tr key={task.id} style={{
                    borderTop: 
                      '1px solid #e5e7eb'
                  }}>
                    <td style={{ 
                      padding: '14px 16px',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      {task.title}
                    </td>
                    <td style={{ 
                      padding: '14px 16px',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      {task.client_name || 
                       task.clientName || '-'}
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
                          handleComplete(task.id)
                        }
                        style={{
                          padding: '6px 14px',
                          background: '#4f46e5',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        Complete
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
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => 
          setShowModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '28px',
            width: '440px',
            maxWidth: '90vw'
          }} onClick={e => 
            e.stopPropagation()}>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ 
                margin: 0,
                fontSize: '18px',
                fontWeight: '600'
              }}>
                Create New Task
              </h2>
              <button
                onClick={() => 
                  setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >×</button>
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
                {modalError}
              </div>
            )}

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
                TASK TITLE *
              </label>
              <input
                type="text"
                placeholder="Enter task title"
                value={taskTitle}
                onChange={e => 
                  setTaskTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

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
                CLIENT NAME
              </label>
              <input
                type="text"
                placeholder="e.g. Nike Marketing"
                value={clientName}
                onChange={e => 
                  setClientName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
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
                PRIORITY LEVEL
              </label>
              <select
                value={priority}
                onChange={e => 
                  setPriority(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white'
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

            <button
              onClick={handleCreate}
              disabled={creating}
              style={{
                width: '100%',
                padding: '12px',
                background: creating 
                  ? '#9ca3af' : '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: creating 
                  ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                fontWeight: '500'
              }}
            >
              {creating 
                ? 'Creating...' 
                : 'Create Task'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
