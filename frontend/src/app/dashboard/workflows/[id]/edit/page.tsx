'use client';

import { useState, useEffect, useCallback, DragEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiCall } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { 
  ArrowLeft, Zap, Play, Pause, Save,
  ChevronRight, Settings,
  Target, Mail, MousePointer, ShoppingCart,
  Smartphone, Clock, GitBranch, BarChart,
  Tag, Info, Bell, Trash2, Check,
  Users, CheckCircle, TrendingUp, X
} from 'lucide-react';
import { Node, Edge, ReactFlowProvider, useNodesState, useEdgesState, addEdge, Connection } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';

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
    { type: 'triggerNode', label: 'Form Submit', icon: '🎯', description: 'Contact fills a form', nodeType: 'trigger' },
    { type: 'triggerNode', label: 'Email Open', icon: '📧', description: 'Contact opens email', nodeType: 'trigger' },
    { type: 'triggerNode', label: 'Link Click', icon: '🖱️', description: 'Contact clicks a link', nodeType: 'trigger' },
    { type: 'triggerNode', label: 'Purchase', icon: '🛒', description: 'Contact buys product', nodeType: 'trigger' },
    { type: 'triggerNode', label: 'Ad Engagement', icon: '📱', description: 'Interacts with ad', nodeType: 'trigger' },
  ]},
  { group: 'CONDITIONS', items: [
    { type: 'conditionNode', label: 'Wait/Delay', icon: '⏰', description: 'Wait before next step', nodeType: 'condition' },
    { type: 'conditionNode', label: 'If/Else Split', icon: '🔀', description: 'Branch based on data', nodeType: 'condition' },
    { type: 'conditionNode', label: 'Score Check', icon: '📊', description: 'Check lead score', nodeType: 'condition' },
  ]},
  { group: 'ACTIONS', items: [
    { type: 'actionNode', label: 'Send Email', icon: '📧', description: 'Send an automated email', nodeType: 'action' },
    { type: 'actionNode', label: 'Add Tag', icon: '🏷️', description: 'Add label to contact', nodeType: 'action' },
    { type: 'actionNode', label: 'Update Score', icon: '📊', description: 'Change lead score', nodeType: 'action' },
    { type: 'actionNode', label: 'Create Task', icon: '📋', description: 'Alert the team', nodeType: 'action' },
    { type: 'actionNode', label: 'Notification', icon: '🔔', description: 'Internal alert', nodeType: 'action' },
  ]},
];

function WorkflowEditorContent() {
  const router = useRouter();
  const { id } = useParams();
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    loadWorkflow();
  }, [id]);

  const loadWorkflow = async () => {
    try {
      const res = await apiCall(`/workflows/${id}`);
      const data = res?.data || res;
      setWorkflow(data);
      setWorkflowName(data.name);
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    } catch (err) {
      toast.error('Failed to load workflow');
      router.push('/dashboard/workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
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

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragStart = (event: DragEvent, nodeType: string, item: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, ...item }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = document.querySelector('.react-flow')?.getBoundingClientRect();
      const dataStr = event.dataTransfer.getData('application/reactflow');

      if (!reactFlowBounds || !dataStr) return;

      const data = JSON.parse(dataStr);
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode: Node = {
        id: uuidv4(),
        type: data.type,
        position,
        data: { 
          label: data.label,
          type: data.nodeType,
          icon: data.icon,
          description: data.description,
          config: {} 
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const addNodeToCanvas = (item: any) => {
    const newNode: Node = {
      id: uuidv4(),
      type: item.type,
      position: { x: 250, y: 250 },
      data: { 
        label: item.label,
        type: item.nodeType,
        icon: item.icon,
        description: item.description,
        config: {} 
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const updateNodeData = (nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              config: {
                ...node.data.config,
                ...config,
              },
            },
          };
        }
        return node;
      })
    );
    setSelectedNode((prev) => prev?.id === nodeId ? {
      ...prev,
      data: {
        ...prev.data,
        config: {
          ...prev.data.config,
          ...config
        }
      }
    } : prev);
  };

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
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
              onClick={handleSave}
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
                        onDragStart={(e) => onDragStart(e, item.type, item)}
                        onClick={() => addNodeToCanvas(item)}
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

          <main className="flex-1 relative bg-slate-50">
            <div className="absolute inset-0">
              <WorkflowCanvas 
                nodes={nodes} 
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onSave={handleSave}
              />
            </div>
            
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

          <aside className="w-80 bg-white border-l border-slate-100 p-8 overflow-y-auto shrink-0">
            {selectedNode ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-900">Node Settings</h3>
                  <button onClick={() => setSelectedNode(null)} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400"><X size={18} /></button>
                </div>
                
                <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{selectedNode.data.icon}</span>
                    <span className="font-bold text-slate-900">{selectedNode.data.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 italic">"{selectedNode.data.description}"</p>
                </div>

                <div className="space-y-6">
                  {/* Common Name field */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Step Name</label>
                    <input 
                      type="text"
                      value={selectedNode.data.label}
                      onChange={(e) => {
                        const newLabel = e.target.value;
                        setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label: newLabel } } : n));
                        setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, label: newLabel } } : null);
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Dynamic Fields based on Node Title */}
                  {selectedNode.data.label === 'Wait/Delay' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Duration</label>
                        <input 
                          type="number"
                          value={selectedNode.data.config?.delay || 1}
                          onChange={(e) => updateNodeData(selectedNode.id, { delay: parseInt(e.target.value) })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unit</label>
                        <select 
                          value={selectedNode.data.config?.unit || 'days'}
                          onChange={(e) => updateNodeData(selectedNode.id, { unit: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm outline-none bg-white"
                        >
                          <option value="minutes">Minutes</option>
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {selectedNode.data.label === 'Send Email' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject Line</label>
                        <input 
                          type="text"
                          value={selectedNode.data.config?.subject || ''}
                          onChange={(e) => updateNodeData(selectedNode.id, { subject: e.target.value })}
                          placeholder="e.g. Welcome to our platform!"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Template</label>
                        <select 
                          value={selectedNode.data.config?.template || 'welcome'}
                          onChange={(e) => updateNodeData(selectedNode.id, { template: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm outline-none bg-white"
                        >
                          <option value="welcome">Welcome Email</option>
                          <option value="product_intro">Product Intro</option>
                          <option value="special_offer">Special Offer</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {selectedNode.data.label === 'If/Else Split' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Filter Field</label>
                        <select 
                          value={selectedNode.data.config?.field || 'email_opened'}
                          onChange={(e) => updateNodeData(selectedNode.id, { field: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm outline-none bg-white"
                        >
                          <option value="email_opened">Email Opened</option>
                          <option value="link_clicked">Link Clicked</option>
                          <option value="purchase_status">Purchase Status</option>
                          <option value="lead_score">Lead Score</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Operator</label>
                           <select 
                            value={selectedNode.data.config?.operator || 'equals'}
                            onChange={(e) => updateNodeData(selectedNode.id, { operator: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm outline-none bg-white"
                           >
                            <option value="equals">Equals</option>
                            <option value="greater_than">Greater than</option>
                           </select>
                        </div>
                        <div className="flex-1">
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Value</label>
                           <input 
                            type="text"
                            value={selectedNode.data.config?.value || ''}
                            onChange={(e) => updateNodeData(selectedNode.id, { value: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm outline-none"
                           />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedNode.data.label === 'Form Submit' && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Form</label>
                      <select 
                        value={selectedNode.data.config?.formId || 'any'}
                        onChange={(e) => updateNodeData(selectedNode.id, { formId: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm outline-none bg-white"
                      >
                        <option value="any">Any Form</option>
                        <option value="newsletter">Newsletter Signup</option>
                        <option value="contact">Contact Us</option>
                      </select>
                    </div>
                  )}

                  {selectedNode.data.label === 'Add Tag' && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tag Name</label>
                      <input 
                        type="text"
                        value={selectedNode.data.config?.tag || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { tag: e.target.value })}
                        placeholder="e.g. prospect-2024"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm outline-none"
                      />
                    </div>
                  )}

                  {selectedNode.data.label === 'Update Score' && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Score Change</label>
                      <input 
                        type="number"
                        value={selectedNode.data.config?.scoreChange || 0}
                        onChange={(e) => updateNodeData(selectedNode.id, { scoreChange: parseInt(e.target.value) })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm outline-none"
                      />
                    </div>
                  )}

                  <div className="pt-8 border-t border-slate-100 flex gap-3">
                    <button 
                      onClick={() => setSelectedNode(null)}
                      className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      Done
                    </button>
                    <button 
                      onClick={() => deleteNode(selectedNode.id)}
                      className="flex-1 py-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <Settings className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                <h4 className="text-slate-400 font-bold text-sm">No node selected</h4>
                <p className="text-slate-300 text-xs mt-1">Click a node on the canvas to configure settings.</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowEditorPage() {
  return (
    <ReactFlowProvider>
      <WorkflowEditorContent />
    </ReactFlowProvider>
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
