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
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [nodeSettings, setNodeSettings] = useState<any>({});

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

  const handleSave = async (customNodes?: any, customEdges?: any) => {
    setSaving(true);
    try {
      await apiCall(`/workflows/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nodes: Array.isArray(customNodes) ? customNodes : nodes,
          edges: Array.isArray(customEdges) ? customEdges : edges,
          name: workflowName,
          updatedAt: new Date().toISOString(),
        })
      });
      toast.success('Workflow saved! ✅');
    } catch (err) {
      console.error('[Workflow] Save failed:', err);
      toast.error('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    try {
      await apiCall(`/workflows/${id}/activate`, { method: 'POST' });
      setWorkflow((prev: any) => ({ ...prev, status: 'active' }));
      toast.success('Workflow activated! 🚀');
    } catch (err) {
      toast.error('Failed to activate workflow');
    }
  };

  const handlePause = async () => {
    try {
      await apiCall(`/workflows/${id}/pause`, { method: 'POST' });
      setWorkflow((prev: any) => ({ ...prev, status: 'paused' }));
      toast.success('Workflow paused');
    } catch (err) {
      toast.error('Failed to pause workflow');
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

  const onNodeClick = useCallback(
    (event: any, node: any) => {
      setSelectedNode(node);
      setNodeSettings(node.data?.config || {});
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

  const renderNodeSettings = () => {
    if (!selectedNode) {
      return (
        <div className="text-center py-12 text-slate-400">
          <p className="text-3xl mb-3">👆</p>
          <p className="font-bold text-slate-600">No node selected</p>
          <p className="text-sm mt-1">Click a node on the canvas to configure settings</p>
        </div>
      );
    }

    const type = selectedNode.data?.type;
    const label = selectedNode.data?.label;

    return (
      <div className="space-y-4">
        {/* Node header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
            type === 'trigger' ? 'bg-emerald-100 text-emerald-600'
            : type === 'action' ? 'bg-blue-100 text-blue-600'
            : type === 'condition' ? 'bg-amber-100 text-amber-600'
            : 'bg-red-100 text-red-600'
          }`}>
            {selectedNode.data?.icon || '⚡'}
          </div>
          <div>
            <p className="font-black text-slate-900 text-sm">{nodeSettings.label || label || ''}</p>
            <p className={`text-xs font-bold uppercase tracking-wide ${
              type === 'trigger' ? 'text-emerald-600'
              : type === 'action' ? 'text-blue-600'
              : type === 'condition' ? 'text-amber-600'
              : 'text-red-600'
            }`}>
              {type}
            </p>
          </div>
        </div>

        {/* Step Name — always shown */}
        <div>
          <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1.5">Step Name</label>
          <input
            type="text"
            value={nodeSettings.label || label || ''}
            onChange={e => setNodeSettings((p: any) => ({ ...p, label: e.target.value }))}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
          />
        </div>

        {/* TRIGGER NODE SETTINGS */}
        {type === 'trigger' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1.5">Trigger Type</label>
              <select
                value={nodeSettings.triggerType || 'form_submit'}
                onChange={e => setNodeSettings((p: any) => ({ ...p, triggerType: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-bold text-slate-800"
              >
                <option value="form_submit">📝 Form Submit</option>
                <option value="email_open">📧 Email Open</option>
                <option value="link_click">🔗 Link Click</option>
                <option value="purchase">💰 Purchase Made</option>
                <option value="ad_engagement">📱 Ad Engagement</option>
                <option value="new_lead">👤 New Lead Added</option>
                <option value="scheduled">📅 Scheduled Time</option>
              </select>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs text-emerald-700 font-bold">✅ This step starts the automation flow</p>
            </div>
          </div>
        )}

        {/* CONDITION NODE SETTINGS */}
        {type === 'condition' && (
          <div className="space-y-3">
            {/* Wait/Delay settings */}
            {(label?.toLowerCase().includes('wait') || label?.toLowerCase().includes('delay')) && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1.5">Wait Duration</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={nodeSettings.delay || 1}
                      onChange={e => setNodeSettings((p: any) => ({ ...p, delay: Number(e.target.value) }))}
                      min={1}
                      className="w-24 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold text-slate-800"
                    />
                    <select
                      value={nodeSettings.unit || 'days'}
                      onChange={e => setNodeSettings((p: any) => ({ ...p, unit: e.target.value }))}
                      className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-bold text-slate-800 bg-white"
                    >
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                    </select>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs text-amber-700 font-bold">⏰ Flow pauses here for {nodeSettings.delay || 1} {nodeSettings.unit || 'days'} before continuing</p>
                </div>
              </div>
            )}

            {/* If/Else Split settings */}
            {(label?.toLowerCase().includes('if') || label?.toLowerCase().includes('split') || label?.toLowerCase().includes('?')) && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1.5">Check Field</label>
                  <select
                    value={nodeSettings.field || 'purchase_status'}
                    onChange={e => setNodeSettings((p: any) => ({ ...p, field: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-bold text-slate-800 bg-white"
                  >
                    <option value="purchase_status">Purchase Status</option>
                    <option value="email_opened">Email Opened</option>
                    <option value="lead_score">Lead Score</option>
                    <option value="tag">Tag Applied</option>
                    <option value="engaged">Engagement</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                    <p className="text-xs font-black text-emerald-700">✅ YES Path</p>
                    <p className="text-[10px] text-emerald-600 font-medium">Condition met</p>
                  </div>
                  <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 text-center">
                    <p className="text-xs font-black text-rose-700">❌ NO Path</p>
                    <p className="text-[10px] text-rose-600 font-medium">Condition not met</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ACTION NODE SETTINGS */}
        {type === 'action' && (
          <div className="space-y-3">
            {/* Send Email settings */}
            {(label?.toLowerCase().includes('email') || label?.toLowerCase().includes('send') || label?.toLowerCase().includes('welcome') || label?.toLowerCase().includes('hub')) && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1.5">Email Subject *</label>
                  <input
                    type="text"
                    value={nodeSettings.subject || ''}
                    onChange={e => setNodeSettings((p: any) => ({ ...p, subject: e.target.value }))}
                    placeholder="Welcome to our platform! 🎉"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1.5">Email Body</label>
                  <textarea
                    value={nodeSettings.body || ''}
                    onChange={e => setNodeSettings((p: any) => ({ ...p, body: e.target.value }))}
                    placeholder="Hi [NAME], Welcome to our platform! Here is how to get started..."
                    rows={4}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 resize-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">Variables: [NAME] [EMAIL] [LINK]</p>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1.5">Template</label>
                  <select 
                    value={nodeSettings.template || 'welcome'}
                    onChange={e => setNodeSettings((p: any) => ({ ...p, template: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-bold text-slate-800 bg-white"
                  >
                    <option value="welcome">Welcome Email</option>
                    <option value="product_intro">Product Intro</option>
                    <option value="special_offer">Special Offer</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1.5">From Name</label>
                  <input
                    type="text"
                    value={nodeSettings.fromName || ''}
                    onChange={e => setNodeSettings((p: any) => ({ ...p, fromName: e.target.value }))}
                    placeholder="Your Agency Name"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Add Tag settings */}
            {label?.toLowerCase().includes('tag') && (
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1.5">Tag Name</label>
                <input
                  type="text"
                  value={nodeSettings.tag || ''}
                  onChange={e => setNodeSettings((p: any) => ({ ...p, tag: e.target.value }))}
                  placeholder="e.g. new_lead, hot, vip"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                />
              </div>
            )}

            {/* Update Score settings */}
            {label?.toLowerCase().includes('score') && (
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1.5">Score Change</label>
                <div className="flex gap-2">
                  <select
                    value={nodeSettings.operator || '+'}
                    onChange={e => setNodeSettings((p: any) => ({ ...p, operator: e.target.value }))}
                    className="w-20 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 bg-white"
                  >
                    <option value="+">+ Add</option>
                    <option value="-">- Remove</option>
                  </select>
                  <input
                    type="number"
                    value={nodeSettings.points || 10}
                    onChange={e => setNodeSettings((p: any) => ({ ...p, points: Number(e.target.value) }))}
                    className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                  />
                  <span className="self-center text-sm text-slate-400 font-bold">pts</span>
                </div>
              </div>
            )}

            {/* Generic action — show description */}
            {!label?.toLowerCase().includes('email') &&
             !label?.toLowerCase().includes('send') &&
             !label?.toLowerCase().includes('welcome') &&
             !label?.toLowerCase().includes('hub') &&
             !label?.toLowerCase().includes('tag') &&
             !label?.toLowerCase().includes('score') && (
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1.5">Description</label>
                <textarea
                  value={nodeSettings.description || selectedNode.data?.description || ''}
                  onChange={e => setNodeSettings((p: any) => ({ ...p, description: e.target.value }))}
                  placeholder="What does this step do?"
                  rows={3}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 resize-none"
                />
              </div>
            )}
          </div>
        )}

        {/* END NODE SETTINGS */}
        {type === 'end' && (
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
            <p className="text-sm font-bold text-rose-700 mb-1">🏁 Flow End Point</p>
            <p className="text-xs text-rose-600 font-medium">The automation stops here. Contacts reaching this step are marked as completed.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              // Apply settings to node
              setNodes((nds: any[]) => nds.map(n => {
                if (n.id === selectedNode.id) {
                  return {
                    ...n,
                    data: {
                      ...n.data,
                      label: nodeSettings.label || n.data.label,
                      config: nodeSettings,
                      description: nodeSettings.subject
                        ? `Subject: ${nodeSettings.subject}`
                        : nodeSettings.delay
                        ? `Wait ${nodeSettings.delay} ${nodeSettings.unit || 'days'}`
                        : n.data.description,
                    }
                  };
                }
                return n;
              }));
              toast.success('Node updated! ✅');
              setSelectedNode(null);
            }}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Apply Changes
          </button>
          <button
            onClick={() => {
              setNodes((nds: any[]) => nds.filter(n => n.id !== selectedNode.id));
              setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
              setSelectedNode(null);
              toast.success('Node deleted 🗑️');
            }}
            className="py-2.5 px-4 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100 border border-rose-200 transition-all"
          >
            🗑️
          </button>
        </div>
      </div>
    );
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
              onClick={workflow?.status === 'active' ? handlePause : handleActivate}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg ${
                workflow?.status === 'active' 
                  ? 'bg-amber-50 text-amber-600 shadow-amber-100 hover:bg-amber-100' 
                  : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'
              }`}
            >
              {workflow?.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
              {workflow?.status === 'active' ? 'Pause Workflow' : 'Activate Workflow'}
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
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-slate-100 p-2 rounded-2xl shadow-2xl flex items-center gap-6 px-8 py-4 z-50">
              {workflow?.status === 'draft' ? (
                <div className="flex items-center gap-4 text-slate-500">
                  <span className="text-sm font-bold flex items-center gap-2">
                    ⏸️ Workflow is in DRAFT mode. Activate to start enrolling contacts.
                  </span>
                  <button
                    onClick={handleActivate}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                  >
                    ▶ Activate Now
                  </button>
                </div>
              ) : (
                <>
                  <AnalyticsItem label="Enrolled" value={workflow?.enrolledCount || 0} icon={<Users size={14} />} />
                  <div className="w-px h-6 bg-slate-200" />
                  <AnalyticsItem label="Completed" value={workflow?.completedCount || 0} icon={<CheckCircle size={14} />} />
                  <div className="w-px h-6 bg-slate-200" />
                  <AnalyticsItem label="Converted" value={workflow?.conversionCount || 0} icon={<Target size={14} />} />
                  <div className="w-px h-6 bg-slate-200" />
                  <AnalyticsItem label="Rate" value={workflow?.conversionRate ? `${workflow.conversionRate}%` : '0%'} icon={<TrendingUp size={14} />} color="indigo" />
                </>
              )}
            </div>
          </main>

          <aside className="w-80 bg-white border-l border-slate-100 p-8 overflow-y-auto shrink-0 z-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900">Node Settings</h3>
              {selectedNode && (
                <button onClick={() => setSelectedNode(null)} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400">
                  <X size={18} />
                </button>
              )}
            </div>
            {renderNodeSettings()}
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
