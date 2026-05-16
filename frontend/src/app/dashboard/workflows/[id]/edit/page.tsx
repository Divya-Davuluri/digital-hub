'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiCall } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { 
  ArrowLeft, Zap, Play, Pause, Save,
  ChevronRight, MoreVertical, Settings,
  Target, Mail, MousePointer, ShoppingCart,
  Smartphone, Clock, GitBranch, BarChart,
  Tag, Info, Bell, Trash2, Check,
  Users, CheckCircle, TrendingUp
} from 'lucide-react';
import { Node, Edge } from 'reactflow';

const WorkflowCanvas = dynamic(
  () => import('@/components/WorkflowCanvas'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[600px] flex items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"/>
          <p className="text-slate-500 font-bold">Initializing Canvas Engine...</p>
        </div>
      </div>
    )
  }
);

const NODE_PALETTE = [
  { group: 'TRIGGERS', items: [
    { type: 'triggerNode', label: 'Form Submit', icon: '🎯', description: 'Contact fills a form' },
    { type: 'triggerNode', label: 'Email Open', icon: '📧', description: 'Contact opens email' },
    { type: 'triggerNode', label: 'Link Click', icon: '🖱️', description: 'Contact clicks a link' },
    { type: 'triggerNode', label: 'Purchase', icon: '🛒', description: 'Contact buys product' },
    { type: 'triggerNode', label: 'Ad Engagement', icon: '📱', description: 'Interacts with ad' },
  ]},
  { group: 'CONDITIONS', items: [
    { type: 'conditionNode', label: 'Wait/Delay', icon: '⏰', description: 'Wait before next step' },
    { type: 'conditionNode', label: 'If/Else Split', icon: '🔀', description: 'Branch based on data' },
    { type: 'conditionNode', label: 'Score Check', icon: '📊', description: 'Check lead score' },
  ]},
  { group: 'ACTIONS', items: [
    { type: 'actionNode', label: 'Send Email', icon: '📧', description: 'Send an automated email' },
    { type: 'actionNode', label: 'Add Tag', icon: '🏷️', description: 'Add label to contact' },
    { type: 'actionNode', label: 'Update Score', icon: '📊', description: 'Change lead score' },
    { type: 'actionNode', label: 'Create Task', icon: '📋', description: 'Alert the team' },
    { type: 'actionNode', label: 'Notification', icon: '🔔', description: 'Internal alert' },
  ]},
];

export default function WorkflowEditorPage() {
  const router = useRouter();
  const { id } = useParams();
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workflowName, setWorkflowName] = useState('');

  useEffect(() => {
    loadWorkflow();
  }, [id]);

  const loadWorkflow = async () => {
    try {
      const res = await apiCall(`/workflows/${id}`);
      const data = res?.data || res;
      setWorkflow(data);
      setWorkflowName(data.name);
    } catch (err) {
      toast.error('Failed to load workflow');
      router.push('/dashboard/workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (nodes: Node[], edges: Edge[]) => {
    setSaving(true);
    try {
      await apiCall(`/workflows/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nodes,
          edges,
          name: workflowName,
        })
      });
      toast.success('Workflow saved!');
    } catch (err) {
      toast.error('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async () => {
    const action = workflow.status === 'active' ? 'pause' : 'activate';
    try {
      await apiCall(`/workflows/${id}/${action}`, { method: 'POST' });
      toast.success(`Workflow ${action}d!`);
      loadWorkflow();
    } catch (err) {
      toast.error(`Failed to ${action}`);
    }
  };

  if (loading) return null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 ml-[260px] flex flex-col">
        {/* Editor Header */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push('/dashboard/workflows')}
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="h-8 w-px bg-slate-100" />
            <div>
              <input 
                type="text" 
                value={workflowName}
                onChange={e => setWorkflowName(e.target.value)}
                className="text-xl font-bold text-slate-900 bg-transparent border-none focus:ring-0 p-0 w-64"
              />
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge status={workflow.status} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{workflow.triggerType}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              disabled={saving}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              {saving ? <Clock className="animate-spin" size={16} /> : <Save size={16} />}
              Save Draft
            </button>
            <button 
              onClick={handleStatusToggle}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg ${
                workflow.status === 'active' 
                  ? 'bg-amber-50 text-amber-600 shadow-amber-100 hover:bg-amber-100' 
                  : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'
              }`}
            >
              {workflow.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
              {workflow.status === 'active' ? 'Pause Workflow' : 'Activate Workflow'}
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Node Palette */}
          <aside className="w-72 bg-white border-r border-slate-100 p-6 overflow-y-auto shrink-0">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Node Palette</h3>
            
            <div className="space-y-8">
              {NODE_PALETTE.map(group => (
                <div key={group.group}>
                  <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      group.group === 'TRIGGERS' ? 'bg-emerald-500' :
                      group.group === 'CONDITIONS' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    {group.group}
                  </p>
                  <div className="space-y-3">
                    {group.items.map(item => (
                      <div 
                        key={item.label}
                        className="p-3 border-2 border-dashed border-slate-100 rounded-2xl cursor-grab hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group active:cursor-grabbing"
                        draggable
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl group-hover:scale-125 transition-transform">{item.icon}</span>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{item.label}</p>
                            <p className="text-[9px] text-slate-400 font-medium">{item.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Canvas Area */}
          <main className="flex-1 relative bg-slate-50">
            <div className="absolute inset-0">
              <WorkflowCanvas 
                initialNodes={workflow.nodes || []} 
                initialEdges={workflow.edges || []}
                onSave={handleSave}
              />
            </div>
            
            {/* Analytics Bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md border border-white/20 p-2 rounded-2xl shadow-2xl flex items-center gap-6 px-8 py-4">
              <AnalyticsItem label="Enrolled" value={workflow.enrolledCount} icon={<Users size={14} />} />
              <div className="w-px h-6 bg-slate-200" />
              <AnalyticsItem label="Completed" value={workflow.completedCount} icon={<CheckCircle size={14} />} />
              <div className="w-px h-6 bg-slate-200" />
              <AnalyticsItem label="Converted" value={workflow.conversionCount} icon={<Target size={14} />} />
              <div className="w-px h-6 bg-slate-200" />
              <AnalyticsItem label="Rate" value={`${workflow.conversionRate}%`} icon={<TrendingUp size={14} />} color="indigo" />
            </div>
          </main>

          {/* Settings Panel */}
          <aside className="w-80 bg-white border-l border-slate-100 p-8 overflow-y-auto shrink-0">
            <div className="text-center py-20">
              <Settings className="w-12 h-12 text-slate-100 mx-auto mb-4" />
              <h4 className="text-slate-400 font-bold text-sm">No node selected</h4>
              <p className="text-slate-300 text-xs mt-1">Click a node on the canvas to configure settings.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function AnalyticsItem({ label, value, icon, color = 'slate' }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className={`p-1.5 rounded-lg ${color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    active:   'bg-emerald-50 text-emerald-600 border-emerald-100',
    paused:   'bg-amber-50 text-amber-600 border-amber-100',
    draft:    'bg-slate-50 text-slate-400 border-slate-100',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${styles[status] || styles.draft}`}>
      {status === 'active' && <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />}
      {status}
    </span>
  );
}
