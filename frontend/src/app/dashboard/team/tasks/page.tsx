'use client';

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";

export default function TeamTasksPage() {
  // ALL HOOKS AT TOP
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [priority, setPriority] = useState('Medium Priority');
  const [dueDate, setDueDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState('');
  const [taskError, setTaskError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  // FUNCTIONS AFTER HOOKS
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setTaskError('');
      const data = await apiFetch('/team/tasks');
      // Handle { success, tasks }
      setTasks(data.tasks || data || []);
    } catch (err: any) {
      console.error("Failed to load tasks:", err);
      setTaskError('Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setModalError('');

      if (!taskTitle) {
        setModalError('Task title is required');
        setCreating(false);
        return;
      }

      // Priority mapping logic from user instructions
      const priorityMap: {[key: string]: string} = {
        'High Priority': 'HIGH',
        'Medium Priority': 'MEDIUM', 
        'Low Priority': 'LOW'
      };
      const priorityValue = priorityMap[priority] || 'MEDIUM';

      const data = await apiFetch('/team/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: taskTitle,
          clientName: clientName,
          priority: priorityValue,
          dueDate: dueDate || null
        }),
      });

      if (data.success) {
        setTasks(prev => [data.task, ...(prev || [])]);
        setShowModal(false);
        setTaskTitle('');
        setClientName('');
        setPriority('Medium Priority');
        setDueDate('');
      } else {
        throw new Error(data.error || 'Failed to create task');
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const markComplete = async (taskId: string) => {
    try {
      const data = await apiFetch(`/team/tasks/${taskId}/complete`, {
        method: 'PATCH',
      });
      if (data.success) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
         <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
         <p className="text-slate-500 text-sm font-medium">Loading tasks...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="team" />
      <div className="flex-1 ml-[260px] flex flex-col">
        <Header />
        <main className="p-8 max-w-7xl mx-auto w-full">
          {taskError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl">
               ⚠️ {taskError}. <button onClick={() => fetchTasks()} className="underline">Retry</button>
            </div>
          )}

          <div className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Task Management</h1>
              <p className="text-sm text-slate-500 mt-1">Track approvals, report generation, and campaign status updates.</p>
            </div>
            <button 
              onClick={() => { setModalError(''); setShowModal(true); }}
              className="btn-primary !py-2.5 !px-6 text-xs font-bold shadow-lg shadow-indigo-100"
            >
               + Create New Task
            </button>
          </div>

          <div className="card !p-0 overflow-hidden bg-white shadow-sm border border-slate-200 rounded-2xl">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900">Active Tasks</h3>
                <div className="flex gap-2">
                   <button className="px-3 py-1.5 text-[11px] font-bold bg-indigo-50 text-indigo-600 rounded-lg">Status: Pending</button>
                </div>
             </div>
             
             {tasks.length > 0 ? (
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                           <th className="px-8 py-4">TASK</th>
                           <th className="px-8 py-4">CLIENT</th>
                           <th className="px-8 py-4">DUE DATE</th>
                           <th className="px-8 py-4">PRIORITY</th>
                           <th className="px-8 py-4">STATUS</th>
                           <th className="px-8 py-4 text-right">ACTION</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {tasks.map((task) => (
                           <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-8 py-5">
                                 <span className="font-semibold text-sm text-slate-900">{task.title}</span>
                              </td>
                              <td className="px-8 py-5 text-sm text-slate-600">
                                 {task.clientName || 'N/A'}
                              </td>
                              <td className="px-8 py-5 text-xs text-slate-500 font-medium">
                                 {task.dueDate || 'N/A'}
                              </td>
                              <td className="px-8 py-5">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                    task.priority?.toUpperCase() === 'HIGH' ? 'bg-red-100 text-red-700' : 
                                    task.priority?.toUpperCase() === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 
                                    'bg-green-100 text-green-700'
                                  }`}>
                                     {task.priority?.toUpperCase()}
                                  </span>
                               </td>
                               <td className="px-8 py-5">
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-700 border-slate-200">
                                     {task.status?.toUpperCase() || 'PENDING'}
                                  </span>
                               </td>
                              <td className="px-8 py-5 text-right">
                                 <button 
                                   onClick={() => markComplete(task.id)}
                                   className="text-xs font-bold text-indigo-600 hover:underline transition-colors"
                                 >
                                   Mark Complete
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
             ) : (
               <div className="p-20 text-center">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No Active Tasks</h3>
                  <p className="text-sm text-slate-500">Click &quot;+ Create New Task&quot; to add your first task</p>
               </div>
             )}
          </div>
        </main>
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 animate-subtle-fade overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Create New Task</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <form className="p-6 space-y-4" onSubmit={handleCreateTask}>
              {modalError && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl">
                   ⚠️ {modalError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Task Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Update client ad copy" 
                  className="input-field" 
                  required 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Nike Marketing" 
                  className="input-field" 
                  required 
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Priority Level</label>
                 <select 
                  className="input-field"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="High Priority">High Priority</option>
                  <option value="Medium Priority">Medium Priority</option>
                  <option value="Low Priority">Low Priority</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={creating}
                className="w-full btn-primary py-3 mt-4 text-sm font-bold disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
