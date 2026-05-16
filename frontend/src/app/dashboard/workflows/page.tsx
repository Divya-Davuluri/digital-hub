'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import toast from 'react-hot-toast';
import {
  Plus, Play, Pause, Trash2, Edit,
  Zap, Users, CheckCircle, TrendingUp,
  Clock, BarChart2, X, ChevronRight
} from 'lucide-react';

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  
  // Create Modal State
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    triggerType: 'form_submit',
    clientId: ''
  });

  useEffect(() => {
    loadWorkflows();
    loadTemplates();
  }, []);

  const loadWorkflows = async () => {
    try {
      const res = await apiCall('/workflows');
      const data = res?.data || res || [];
      setWorkflows(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await apiCall('/workflows/templates');
      const data = res?.data || res || [];
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {}
  };

  const handleStatusToggle = async (workflow: any) => {
    const action = workflow.status === 'active' ? 'pause' : 'activate';
    try {
      await apiCall(`/workflows/${workflow.id}/${action}`, { method: 'POST' });
      toast.success(`Workflow ${action}d!`);
      loadWorkflows();
    } catch (err) {
      toast.error(`Failed to ${action}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await apiCall(`/workflows/${id}`, { method: 'DELETE' });
      toast.success('Workflow deleted');
      loadWorkflows();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    const name = prompt('Enter workflow name:');
    if (!name) return;
    try {
      const res = await apiCall('/workflows/from-template', {
        method: 'POST',
        body: JSON.stringify({ templateId, name })
      });
      const workflow = res?.data || res;
      if (workflow?.id) {
        toast.success('Workflow created from template!');
        router.push(`/dashboard/workflows/${workflow.id}/edit`);
      }
    } catch (err) {
      toast.error('Failed to create from template');
    }
  };

  const handleCreateNew = async () => {
    if (!newWorkflow.name.trim()) return toast.error('Name is required');
    try {
      const res = await apiCall('/workflows', {
        method: 'POST',
        body: JSON.stringify(newWorkflow)
      });
      const workflow = res?.data || res;
      if (workflow?.id) {
        toast.success('Workflow created!');
        router.push(`/dashboard/workflows/${workflow.id}/edit`);
      }
    } catch (err) {
      toast.error('Failed to create workflow');
    }
  };

  const stats = {
    total:  workflows.length,
    active: workflows.filter(w => w.status==='active').length,
    paused: workflows.filter(w => w.status==='paused').length,
    totalEnrolled: workflows.reduce((s,w) => s + (w.enrolledCount||0), 0),
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-[260px]">
        <Header />
        <main className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Automation Workflows</h1>
              <p className="text-slate-500 mt-1">Build and manage marketing automation flows.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowTemplates(true)}
                className="bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
              >
                <Zap size={18} className="text-indigo-600" />
                Templates
              </button>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                <Plus size={18} />
                New Workflow
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <StatCard title="Total" value={stats.total} subtext="workflows" icon={<Zap size={20} />} color="slate" />
            <StatCard title="Active" value={stats.active} subtext="running" icon={<Play size={20} />} color="emerald" />
            <StatCard title="Paused" value={stats.paused} subtext="on hold" icon={<Pause size={20} />} color="amber" />
            <StatCard title="Enrolled" value={stats.totalEnrolled} subtext="contacts" icon={<Users size={20} />} color="indigo" />
          </div>

          {/* Workflow List */}
          {workflows.length === 0 && !loading ? (
            <div className="bg-white rounded-[40px] border border-slate-100 p-20 text-center shadow-sm">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">No workflows yet</h3>
              <p className="text-slate-500 mt-2 mb-8 max-w-md mx-auto">Create your first automation to save time and nurture your leads automatically.</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => setShowTemplates(true)} className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all">Browse Templates</button>
                <button onClick={() => setShowCreateModal(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Create from Scratch</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.isArray(workflows) && workflows.map((w) => (
                <div key={w.id} className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl">
                        ⚡
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{w.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StatusBadge status={w.status} />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{w.triggerType}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => router.push(`/dashboard/workflows/${w.id}/edit`)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(w.id)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-rose-600"><Trash2 size={18} /></button>
                    </div>
                  </div>

                  <p className="text-slate-500 text-sm mb-6 line-clamp-2">{w.description || 'No description provided.'}</p>

                  <div className="grid grid-cols-4 gap-3 mb-6">
                    <MiniStat label="Enrolled" value={w.enrolledCount} />
                    <MiniStat label="Completed" value={w.completedCount} />
                    <MiniStat label="Converted" value={w.conversionCount} />
                    <MiniStat label="Rate" value={`${w.conversionRate}%`} />
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Clock size={14} />
                      {w.lastRunAt ? `Last run: ${new Date(w.lastRunAt).toLocaleString()}` : 'Never run'}
                    </div>
                    <button 
                      onClick={() => handleStatusToggle(w)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                        w.status === 'active' 
                          ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' 
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {w.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                      {w.status === 'active' ? 'Pause' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Workflow Templates</h2>
                <p className="text-slate-500 text-sm">Start faster with pre-built automation sequences.</p>
              </div>
              <button onClick={() => setShowTemplates(false)} className="p-2 hover:bg-white rounded-full transition-colors border border-slate-100 shadow-sm">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(tpl => (
                <div key={tpl.id} className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all flex flex-col group">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                    {tpl.icon}
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">{tpl.name}</h4>
                  <p className="text-slate-500 text-xs mb-4 flex-1 italic">"{tpl.description}"</p>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-wider">{tpl.category}</span>
                  </div>
                  <button 
                    onClick={() => handleCreateFromTemplate(tpl.id)}
                    className="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                  >
                    Use Template <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full"><X size={24} /></button>
            <h2 className="text-3xl font-black text-slate-900 mb-2">New Workflow</h2>
            <p className="text-slate-500 mb-8 font-medium">Build your automation from scratch.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Workflow Name</label>
                <input 
                  type="text" 
                  value={newWorkflow.name}
                  onChange={e => setNewWorkflow({...newWorkflow, name: e.target.value})}
                  placeholder="e.g. Summer Nurture Campaign"
                  className="w-full px-6 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                <textarea 
                  value={newWorkflow.description}
                  onChange={e => setNewWorkflow({...newWorkflow, description: e.target.value})}
                  rows={2}
                  placeholder="What does this workflow do?"
                  className="w-full px-6 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-slate-900 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Initial Trigger</label>
                <select 
                  value={newWorkflow.triggerType}
                  onChange={e => setNewWorkflow({...newWorkflow, triggerType: e.target.value})}
                  className="w-full px-6 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900 bg-white"
                >
                  <option value="form_submit">Form Submit</option>
                  <option value="email_open">Email Open</option>
                  <option value="link_click">Link Click</option>
                  <option value="purchase">Purchase</option>
                  <option value="ad_engagement">Ad Engagement</option>
                  <option value="new_lead">New Lead</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowCreateModal(false)} className="flex-1 py-4 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-all">Cancel</button>
                <button onClick={handleCreateNew} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Create Workflow</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, subtext, icon, color }: any) {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-50 text-slate-600',
  };
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <h2 className="text-3xl font-black text-slate-900">{value}</h2>
        <span className="text-xs font-bold text-slate-400 lowercase">{subtext}</span>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: any) {
  return (
    <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100 text-center">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    active:   'bg-emerald-50 text-emerald-600 border-emerald-100',
    paused:   'bg-amber-50 text-amber-600 border-amber-100',
    draft:    'bg-slate-50 text-slate-400 border-slate-100',
    archived: 'bg-slate-200 text-slate-600 border-slate-300',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${styles[status] || styles.draft}`}>
      {status === 'active' && <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />}
      {status}
    </span>
  );
}
