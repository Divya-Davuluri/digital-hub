'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import apiCall from '@/lib/api';

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [creating, setCreating] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string>('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/team/tasks');
      setTasks(data.tasks || []);
    } catch (err: any) {
      console.error('Fetch tasks:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!taskTitle.trim()) {
      setModalError('Task title required');
      return;
    }
    try {
      setCreating(true);
      setModalError('');
      
      const data = await apiCall(
        '/api/team/tasks',
        {
          method: 'POST',
          body: JSON.stringify({
            title: taskTitle.trim(),
            clientName: clientName.trim(),
            priority: priority
          })
        }
      );

      if (!data.success) {
        throw new Error(
          data.error || 'Failed to create task'
        );
      }

      setTasks((prev: any[]) => 
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
      await apiCall(
        `/api/team/tasks/${id}/complete`,
        { method: 'PATCH' }
      );
      setTasks((prev: any[]) =>
        prev.filter((t: any) => t.id !== id)
      );
    } catch (err) {
      console.error('Complete task:', err);
    }
  };

  const getPriorityStyle = (p: string): { bg: string; color: string } => {
    if (p === 'HIGH') return { bg: '#fee2e2', color: '#991b1b' };
    if (p === 'LOW') return { bg: '#d1fae5', color: '#065f46' };
    return { bg: '#fef3c7', color: '#92400e' };
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="team" />
      
      <div className="flex-1 ml-64 min-h-screen">
        <Header />
        
        <main className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Task Management</h1>
              <p className="text-slate-500 text-sm mt-1">
                Track approvals, report generation, and campaign status updates.
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
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm"
            >
              + Create New Task
            </button>
          </div>

          {/* Tasks Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Active Tasks</h2>
              <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500">
                PENDING
              </span>
            </div>

            {loading ? (
              <div className="p-20 text-center text-slate-400 text-sm animate-pulse">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="p-20 text-center">
                <div className="text-4xl mb-4 opacity-50">📋</div>
                <h3 className="text-slate-900 font-bold mb-1">No Active Tasks</h3>
                <p className="text-slate-400 text-sm">Click "+ Create New Task" to add your first task</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Task</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Client</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Priority</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.map((task: Task) => {
                      const ps = getPriorityStyle(task.priority);
                      return (
                        <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 font-semibold text-sm text-slate-900">{task.title}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{task.client_name || '-'}</td>
                          <td className="px-6 py-4">
                            <span 
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter"
                              style={{ backgroundColor: ps.bg, color: ps.color }}
                            >
                              {task.priority || 'MEDIUM'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter bg-amber-50 text-amber-700 border border-amber-100">
                              {task.status || 'PENDING'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleComplete(task.id)}
                              className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md font-bold text-[10px] uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                            >
                              ✓ Complete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Create New Task</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl line-height-1">×</button>
            </div>

            <div className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100">
                  ⚠️ {modalError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Review Q2 Report"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Client Name</label>
                <input
                  type="text"
                  placeholder="e.g. Nike Marketing"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none"
                >
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
