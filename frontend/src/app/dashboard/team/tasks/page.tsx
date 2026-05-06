'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
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

  const getToken = () =>
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') || '';

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/team/tasks', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
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

      const res = await fetch('/api/team/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: taskTitle,
          clientName: clientName,
          priority: priority
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create task');
      }

      setTasks((prev: any[]) => [data.task, ...prev] as any[]);
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
      await fetch(`/api/team/tasks/${id}/complete`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      setTasks((prev: any[]) => prev.filter((t: any) => t.id !== id));
    } catch (err) {
      console.error('Complete error:', err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-white">
      <Sidebar role="team" />
      
      <div className="flex-1 ml-[280px] min-h-screen bg-grid relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <Header />

        <main className="p-10 max-w-[1400px] mx-auto relative z-10 animate-fade-in">
          <header className="flex justify-between items-end mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">Operational Flow</span>
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Task Ledger</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter italic uppercase text-white">
                Mission <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">Control</span>
              </h1>
              <p className="text-slate-400 mt-2 font-medium tracking-wide">Manage, track, and synchronize agency operations with precision.</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary !px-8 !py-4 shadow-2xl group"
            >
              <span className="text-lg group-hover:rotate-90 transition-transform duration-500">+</span>
              <span className="uppercase text-xs tracking-[0.2em] font-black">Initialize Task</span>
            </button>
          </header>

          <div className="card !p-0 overflow-hidden group">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">Active Queue</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                   <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status: In Progress</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-24 text-center">
                <div className="inline-block w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Syncing with ledger...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-32 text-center">
                <div className="text-6xl mb-6 opacity-20 grayscale group-hover:grayscale-0 transition-all duration-700">📋</div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-white italic mb-2">Queue Empty</h3>
                <p className="text-slate-500 text-sm font-medium tracking-wide">System reports no pending actions for this tenant.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02]">
                      {['Task Identity', 'Client Entity', 'Priority', 'Current Status', 'Operations'].map(h => (
                        <th key={h} className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task: any, i: number) => (
                      <tr key={task.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group/row">
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-white group-hover/row:text-primary transition-colors">{task.title}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">ID: {task.id.slice(0,8)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                            {task.client_name || task.clientName || '---'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                            task.priority === 'HIGH' 
                              ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                              : task.priority === 'LOW'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {task.priority || 'MEDIUM'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                             <span className="text-[10px] font-black text-amber-400/80 uppercase tracking-widest">{task.status || 'PENDING'}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                          <button
                            onClick={() => handleComplete(task.id)}
                            className="px-5 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all duration-300 text-[10px] font-black uppercase tracking-widest"
                          >
                            Mark Complete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modern Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="glass-panel w-full max-w-lg p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] -mr-16 -mt-16" />
            
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Create Task</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Operational Directive</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white text-2xl transition-colors">×</button>
            </div>

            {modalError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-8 flex items-center gap-3">
                 <span className="text-red-400 text-sm">⚠️</span>
                 <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">{modalError}</p>
              </div>
            )}

            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Task Objective</label>
                <input
                  type="text"
                  placeholder="e.g. Generate Campaign Audit"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="input-field font-bold tracking-wide"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Client Entity</label>
                <input
                  type="text"
                  placeholder="Associated Client Name"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="input-field font-bold tracking-wide"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Priority Level</label>
                <div className="grid grid-cols-3 gap-4">
                  {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        priority === p 
                          ? 'bg-primary text-white border-primary shadow-lg' 
                          : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/10'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={creating}
                className="btn-primary w-full !py-4 shadow-2xl mt-4"
              >
                <span className="uppercase text-xs tracking-[0.3em] font-black">
                  {creating ? 'Syncing...' : 'Deploy Task'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
