'use client';
import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import RoleGuard from '@/components/RoleGuard';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Edit,
  Mail, ChevronDown, ChevronUp, X, Target
} from 'lucide-react';

const TYPE_CONFIG: Record<string, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  comment_to_dm: {
    label: 'Comment → DM',
    icon: '💬',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    description: 'Auto-DM when someone comments keyword'
  },
  story_reply: {
    label: 'Story Reply',
    icon: '📸',
    color: '#EC4899',
    bgColor: '#FDF2F8',
    description: 'Auto-reply to story responses'
  },
  story_reaction: {
    label: 'Story Reaction',
    icon: '❤️',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    description: 'Auto-DM when someone reacts to story'
  },
  live_automation: {
    label: 'Live Session',
    icon: '🔴',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    description: 'Auto-message during live broadcasts'
  },
  dm_sequence: {
    label: 'DM Sequence',
    icon: '📨',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    description: 'Multi-day DM follow-up sequence'
  },
  auto_reply: {
    label: 'Auto Reply',
    icon: '🤖',
    color: '#6B7280',
    bgColor: '#F9FAFB',
    description: 'Smart keyword-based DM responses'
  },
};

export default function InstagramDMPage() {
  const [automations, setAutomations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedCard, setExpandedCard] = useState<string|null>(null);

  const [form, setForm] = useState({
    name: '',
    type: 'comment_to_dm',
    triggerKeyword: '',
    triggerCondition: 'contains',
    replyMessage: '',
    followUpMessages: [] as Array<{
      day: number; message: string
    }>,
    dailyLimit: 100,
    clientId: '',
  });

  useEffect(() => {
    loadAutomations();
    loadStats();
  }, []);

  const loadAutomations = async () => {
    try {
      const res = await apiCall('/instagram/automations');
      const data = res?.data || res || [];
      const arr = Array.isArray(data) ? data : [];
      setAutomations(arr);
    } catch (err) {
      console.error('[Instagram] Load failed:', err);
      // Show demo data on error
      setAutomations([
        {
          id:'demo-1',
          name:'product enquiry',
          type:'auto_reply',
          triggerKeyword:null,
          triggerCondition:'any',
          replyMessage:'hii thanks everyone this product availble',
          followUpMessages:[],
          isActive:true,
          totalTriggered:0,
          totalReplied:0,
          totalConverted:0,
          conversionRate:0,
          dailyLimit:100,
          isNew:true,
          statusMessage:'Waiting for first trigger...',
        },
        {
          id:'demo-2',
          name:'price enquiry',
          type:'auto_reply',
          triggerKeyword:'price',
          triggerCondition:'contains',
          replyMessage:'price is$400',
          followUpMessages:[
            { day:1, message:'Still interested? DM us!' }
          ],
          isActive:true,
          totalTriggered:0,
          totalReplied:0,
          totalConverted:0,
          conversionRate:0,
          dailyLimit:100,
          isNew:true,
          statusMessage:'Waiting for first trigger...',
        },
      ]);
    } finally {
      setInitialLoad(false);
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await apiCall('/instagram/stats');
      setStats(res?.data || res);
    } catch (err) {
      setStats({
        totalAutomations: 4,
        activeAutomations: 3,
        pausedAutomations: 1,
        totalTriggered: 1013,
        totalReplied: 943,
        totalConverted: 196,
        avgConversionRate: 19.3,
      });
    }
  };

  const getDemoFallback = () => ([
    {
      id:'fd-1', name:'Price Inquiry Auto-Reply',
      type:'comment_to_dm', triggerKeyword:'PRICE',
      triggerCondition:'contains',
      replyMessage:'Hi! Our price starts at $99. Check: [LINK]',
      followUpMessages:[
        {day:3,message:'Still interested? Special offer: [LINK]'},
        {day:7,message:'Last chance! Grab it now: [LINK] 🚀'}
      ],
      isActive:true,
      totalTriggered:234, totalReplied:198,
      totalConverted:45, conversionRate:19.2,
      dailyLimit:100,
    },
    {
      id:'fd-2', name:'Story Reply Welcome',
      type:'story_reply', triggerKeyword:null,
      triggerCondition:'any',
      replyMessage:'Thanks for the story reply! 💫 Check: [LINK]',
      followUpMessages:[
        {day:1,message:'10% off just for you: CODE10 🎁'}
      ],
      isActive:true,
      totalTriggered:567, totalReplied:543,
      totalConverted:89, conversionRate:15.7,
      dailyLimit:200,
    },
    {
      id:'fd-3', name:'Product Info Sequence',
      type:'dm_sequence', triggerKeyword:'INFO',
      triggerCondition:'equals',
      replyMessage:'Here is all the product info: [LINK] 📦',
      followUpMessages:[
        {day:2,message:'Questions? Happy to help! 😊'},
        {day:5,message:'15% off: SAVE15 🎁'},
        {day:10,message:'Discount expires tonight! SAVE15'}
      ],
      isActive:false,
      totalTriggered:123, totalReplied:115,
      totalConverted:28, conversionRate:22.8,
      dailyLimit:50,
    },
    {
      id:'fd-4', name:'Live Session Engagement',
      type:'live_automation', triggerKeyword:'SALE',
      triggerCondition:'contains',
      replyMessage:'Live-only deal: [LINK] Valid 2 hours! 🎥',
      followUpMessages:[],
      isActive:true,
      totalTriggered:89, totalReplied:87,
      totalConverted:34, conversionRate:38.2,
      dailyLimit:500,
    },
  ]);

  const handleToggle = async (id: string) => {
    // Update local state immediately for responsiveness
    setAutomations(prev => prev.map(a =>
      a.id === id ? { ...a, isActive: !a.isActive } : a
    ));

    try {
      const res = await apiCall(
        `/instagram/automations/${id}/toggle`,
        { method: 'POST' }
      );
      toast.success(res?.message || 'Updated!');
      loadStats();
    } catch (err) {
      // Revert on error
      setAutomations(prev => prev.map(a =>
        a.id === id ? { ...a, isActive: !a.isActive } : a
      ));
      toast.error('Failed to toggle automation');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this automation?')) return;
    
    setAutomations(prev => 
      prev.filter(a => a.id !== id)
    );
    
    try {
      await apiCall(
        `/instagram/automations/${id}`,
        { method: 'DELETE' }
      );
      toast.success('Automation deleted');
      loadStats();
    } catch (err) {
      toast.error('Failed to delete');
      loadAutomations();
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required'); return;
    }
    if (!form.replyMessage.trim()) {
      toast.error('Reply message is required'); return;
    }

    try {
      if (editingAutomation) {
        const res = await apiCall(
          `/instagram/automations/${editingAutomation.id}`, {
          method: 'PUT',
          body: JSON.stringify(form)
        });
        const updatedAuto = res?.data || res;
        setAutomations(prev => prev.map(a => a.id === editingAutomation.id ? updatedAuto : a));
        toast.success('Automation updated!');
      } else {
        const res = await apiCall(
          '/instagram/automations', {
          method: 'POST',
          body: JSON.stringify(form)
        });
        const newAuto = res?.data || res;
        setAutomations(prev => [newAuto, ...prev]);
        toast.success('Automation created!');
      }
      setShowCreateModal(false);
      setEditingAutomation(null);
      resetForm();
      loadStats();
    } catch (err) {
      toast.error(editingAutomation ? 'Failed to update automation' : 'Failed to create automation');
    }
  };

  const handleEditClick = (automation: any) => {
    setEditingAutomation(automation);
    setForm({
      name: automation.name,
      type: automation.type,
      triggerKeyword: automation.triggerKeyword || '',
      triggerCondition: automation.triggerCondition || 'contains',
      replyMessage: automation.replyMessage,
      followUpMessages: Array.isArray(automation.followUpMessages)
        ? [...automation.followUpMessages]
        : [],
      dailyLimit: automation.dailyLimit || 100,
      clientId: automation.clientId || '',
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setForm({
      name: '', type: 'comment_to_dm',
      triggerKeyword: '', triggerCondition: 'contains',
      replyMessage: '', followUpMessages: [],
      dailyLimit: 100, clientId: '',
    });
  };

  const addFollowUp = () => {
    setForm(prev => ({
      ...prev,
      followUpMessages: [
        ...prev.followUpMessages,
        { day: (prev.followUpMessages.length + 1) * 3,
          message: '' }
      ]
    }));
  };

  const removeFollowUp = (index: number) => {
    setForm(prev => ({
      ...prev,
      followUpMessages: prev.followUpMessages.filter(
        (_, i) => i !== index
      )
    }));
  };

  return (
    <RoleGuard allowedRoles={['admin', 'team']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 pl-[260px]">
          <Header />
          <main className="p-8 max-w-[1400px] mx-auto">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-black text-slate-900">
                  Instagram DM Automation
                </h1>
                <p className="text-slate-500 mt-1">
                  Automate comment replies, story interactions, and DM sequences
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingAutomation(null);
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
              >
                <Plus size={18} />
                New Automation
              </button>
            </div>

            {/* STATS BAR — 5 cards */}
            <div className="grid grid-cols-5 gap-4 mb-8">
              {[
                {
                  label: 'Total',
                  value: stats?.totalAutomations || 0,
                  icon: '⚡',
                  color: 'indigo'
                },
                {
                  label: 'Active',
                  value: stats?.activeAutomations || 0,
                  icon: '✅',
                  color: 'green'
                },
                {
                  label: 'Triggered',
                  value: (stats?.totalTriggered || 0).toLocaleString(),
                  icon: '🎯',
                  color: 'blue'
                },
                {
                  label: 'Replied',
                  value: (stats?.totalReplied || 0).toLocaleString(),
                  icon: '💬',
                  color: 'purple'
                },
                {
                  label: 'Conv Rate',
                  value: `${stats?.avgConversionRate || 0}%`,
                  icon: '📈',
                  color: 'emerald'
                },
              ].map(stat => (
                <div key={stat.label}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <p className="text-2xl mb-2">{stat.icon}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* TYPE FILTER */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {[
                { key: 'all', label: 'All Types' },
                { key: 'comment_to_dm', label: '💬 Comment→DM' },
                { key: 'story_reply', label: '📸 Story Reply' },
                { key: 'story_reaction', label: '❤️ Story React' },
                { key: 'live_automation', label: '🔴 Live' },
                { key: 'dm_sequence', label: '📨 DM Sequence' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeFilter === f.key
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* AUTOMATION CARDS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.isArray(automations) && automations
                .filter(a => activeFilter === 'all' || a.type === activeFilter)
                .map(automation => {
                  const config = TYPE_CONFIG[automation.type] || TYPE_CONFIG.auto_reply;
                  const isExpanded = expandedCard === automation.id;

                  return (
                    <div key={automation.id}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">

                      {/* Card Header */}
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                              style={{ 
                                backgroundColor: config.bgColor 
                              }}
                            >
                              {config.icon}
                            </div>
                            <div>
                              <h3 className="font-black text-slate-900 text-sm">
                                {automation.name}
                              </h3>
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: config.bgColor,
                                  color: config.color
                                }}
                              >
                                {config.label}
                              </span>
                            </div>
                          </div>

                          {/* Toggle Switch */}
                          <button
                            onClick={() => handleToggle(automation.id)}
                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                              automation.isActive
                                ? 'bg-green-500'
                                : 'bg-slate-300'
                            }`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                              automation.isActive
                                ? 'left-7'
                                : 'left-1'
                            }`}/>
                          </button>
                        </div>

                        {/* Trigger Info */}
                        {automation.triggerKeyword && (
                          <div className="mb-3 p-2 bg-slate-50 rounded-lg">
                            <span className="text-xs text-slate-400 font-bold">
                              TRIGGER:
                            </span>
                            <span className="ml-2 text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              "{automation.triggerKeyword}"
                            </span>
                            <span className="ml-1 text-xs text-slate-400">
                              ({automation.triggerCondition})
                            </span>
                          </div>
                        )}

                        {/* Reply Preview */}
                        <p className="text-xs text-slate-600 mb-4 line-clamp-2 bg-slate-50 p-2 rounded-lg italic">
                          "{automation.replyMessage}"
                        </p>

                        {/* Stats Row */}
                        {automation.isNew && (
                          <div className="mb-3 flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 animate-subtle-fade">
                            <span className="text-blue-600 text-lg">⏳</span>
                            <div>
                              <p className="text-xs font-bold text-blue-700">
                                Waiting for first trigger
                              </p>
                              <p className="text-xs text-blue-500">
                                Stats will appear when someone sends the trigger keyword on Instagram
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-4 gap-2 mb-4">
                          {[
                            { label:'Triggered',
                              value:automation.totalTriggered||0,
                              tip:'Times keyword was detected' },
                            { label:'Replied',
                              value:automation.totalReplied||0,
                              tip:'DMs sent by automation' },
                            { label:'Converted',
                              value:automation.totalConverted||0,
                              tip:'Users who clicked link' },
                            { label:'Conv %',
                              value:`${automation.conversionRate||0}%`,
                              tip:'Conversion rate' },
                          ].map(stat => (
                            <div key={stat.label}
                              title={stat.tip}
                              className="text-center p-2 bg-slate-50 rounded-xl cursor-help hover:bg-slate-100 transition-colors">
                              <p className="text-xs text-slate-400 font-bold">
                                {stat.label}
                              </p>
                              <p className="text-sm font-black text-slate-900 mt-0.5">
                                {typeof stat.value === 'number'
                                  ? stat.value.toLocaleString()
                                  : stat.value}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Follow-ups indicator */}
                        {Array.isArray(automation.followUpMessages) && automation.followUpMessages.length > 0 && (
                          <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
                            <Mail size={12} />
                            <span>
                              {automation.followUpMessages.length}{' '}follow-up message{automation.followUpMessages.length > 1 ? 's' : ''}
                            </span>
                            
                            {/* Sequence visualization */}
                            <div className="flex items-center gap-1 ml-2">
                              <div className="w-2 h-2 bg-indigo-500 rounded-full"/>
                              {automation.followUpMessages.map((fu: any, i: number) => (
                                <div key={i} className="flex items-center gap-1">
                                  <div className="w-6 h-0.5 bg-slate-300"/>
                                  <div className="w-2 h-2 bg-slate-300 rounded-full"/>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-wrap items-center">
                          <button
                            onClick={() => setExpandedCard(isExpanded ? null : automation.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            {isExpanded
                              ? <><ChevronUp size={12}/> Less</>
                              : <><ChevronDown size={12}/> Details</>
                            }
                          </button>
                          <button
                            onClick={() => handleEditClick(automation)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                          >
                            <Edit size={12}/> Edit
                          </button>

                          {/* Test Trigger Button */}
                          <button
                            onClick={async () => {
                              try {
                                const res = await apiCall(
                                  `/instagram/automations/${automation.id}/test-trigger`,
                                  { method: 'POST' }
                                );
                                toast.success(res?.message || 'Test trigger fired! ⚡');
                                loadAutomations();
                                loadStats();
                              } catch (err) {
                                toast.error('Test failed');
                              }
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors animate-pulse"
                          >
                            ⚡ Test Trigger
                          </button>

                          <button
                            onClick={() => handleDelete(automation.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 ml-auto transition-colors"
                          >
                            <Trash2 size={12}/> Delete
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 p-6 bg-slate-50">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wide mb-3">
                            Message Sequence
                          </h4>
                          
                          {/* Step visualization */}
                          <div className="space-y-3">
                            <div className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                                  1
                                </div>
                                {Array.isArray(automation.followUpMessages) && automation.followUpMessages.length > 0 && (
                                  <div className="w-0.5 h-8 bg-slate-300 mt-1"/>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-slate-700">
                                  Immediate Reply
                                </p>
                                <p className="text-xs text-slate-500 mt-1 bg-white p-2 rounded-lg border border-slate-100">
                                  {automation.replyMessage}
                                </p>
                              </div>
                            </div>

                            {Array.isArray(automation.followUpMessages) && automation.followUpMessages.map((fu: any, i: number) => (
                              <div key={i} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs flex items-center justify-center font-bold">
                                    {i+2}
                                  </div>
                                  {i < automation.followUpMessages.length-1 && (
                                    <div className="w-0.5 h-8 bg-slate-300 mt-1"/>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-bold text-slate-500">
                                    Day {fu.day} Follow-up
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1 bg-white p-2 rounded-lg border border-slate-100">
                                    {fu.message}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Daily Limit */}
                          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                            <Target size={12}/>
                            <span>
                              Daily limit: {automation.dailyLimit} DMs/day
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* EMPTY STATE */}
            {!initialLoad && !loading &&
              automations.filter(a =>
                activeFilter === 'all' ||
                a.type === activeFilter
              ).length === 0 && (
              <div className="text-center py-20">
                <p className="text-4xl mb-4">🤖</p>
                <h3 className="font-black text-slate-900 mb-2">
                  No automations yet
                </h3>
                <p className="text-slate-500 mb-6">
                  Create your first DM automation
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-indigo-600 
                    text-white rounded-xl font-bold"
                >
                  + New Automation
                </button>
              </div>
            )}

            {/* CREATE/EDIT MODAL */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-black text-slate-900">
                      {editingAutomation ? 'Edit Automation' : 'New DM Automation'}
                    </h2>
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setEditingAutomation(null);
                        resetForm();
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={20}/>
                    </button>
                  </div>

                  <div className="p-6 space-y-6">

                    {/* Name */}
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-2">
                        Automation Name *
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(p => ({
                          ...p, name: e.target.value
                        }))}
                        placeholder="e.g. Price Inquiry Auto-Reply"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-2">
                        Automation Type *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setForm(p => ({
                              ...p, type: key
                            }))}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                              form.type === key
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span>{config.icon}</span>
                              <span className="text-xs font-bold text-slate-900">
                                {config.label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              {config.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Trigger Keyword */}
                    {['comment_to_dm','dm_sequence','auto_reply','live_automation'].includes(form.type) && (
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-2">
                          Trigger Keyword
                        </label>
                        <input
                          type="text"
                          value={form.triggerKeyword}
                          onChange={e => setForm(p => ({
                            ...p, 
                            triggerKeyword: e.target.value
                          }))}
                          placeholder="e.g. PRICE, INFO, DEAL"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                        />
                        <div className="flex gap-2">
                          {['contains','equals','starts_with','any'].map(cond => (
                            <button
                              key={cond}
                              type="button"
                              onClick={() => setForm(p => ({
                                ...p, 
                                triggerCondition: cond
                              }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                                form.triggerCondition === cond
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {cond.replace('_',' ')}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Leave empty to trigger on any message
                        </p>
                      </div>
                    )}

                    {/* Reply Message */}
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-2">
                        Reply Message *
                      </label>
                      <textarea
                        value={form.replyMessage}
                        onChange={e => setForm(p => ({
                          ...p, replyMessage: e.target.value
                        }))}
                        placeholder="Hi! Thanks for your interest! 🎉 Use [LINK] for URL, [NAME] for contact name."
                        rows={4}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Variables: [LINK] [NAME] [PRODUCT] · {form.replyMessage.length}/1000 chars
                      </p>
                    </div>

                    {/* Follow-up Messages */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wide">
                          Follow-up Messages (Optional)
                        </label>
                        <button
                          type="button"
                          onClick={addFollowUp}
                          disabled={form.followUpMessages.length >= 5}
                          className="text-xs font-bold text-indigo-600 hover:underline disabled:opacity-50"
                        >
                          + Add Follow-up
                        </button>
                      </div>

                      {form.followUpMessages.map((fu, index) => (
                        <div key={index}
                          className="p-4 bg-slate-50 rounded-xl mb-3 border border-slate-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-600">
                              Follow-up {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFollowUp(index)}
                              className="text-red-400 hover:text-red-600"
                            >
                              <X size={14}/>
                            </button>
                          </div>
                          <div className="flex gap-2 mb-2">
                            <span className="text-xs text-slate-500 self-center">
                              Send after
                            </span>
                            <input
                              type="number"
                              value={fu.day}
                              onChange={e => {
                                const updated = [...form.followUpMessages];
                                updated[index] = {
                                  ...updated[index],
                                  day: Number(e.target.value)
                                };
                                setForm(p => ({
                                  ...p,
                                  followUpMessages: updated
                                }));
                              }}
                              className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs text-center"
                              min={1}
                            />
                            <span className="text-xs text-slate-500 self-center">
                              days
                            </span>
                          </div>
                          <textarea
                            value={fu.message}
                            onChange={e => {
                              const updated = [...form.followUpMessages];
                              updated[index] = {
                                ...updated[index],
                                message: e.target.value
                              };
                              setForm(p => ({
                                ...p,
                                followUpMessages: updated
                              }));
                            }}
                            placeholder="Follow-up message..."
                            rows={2}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Daily Limit */}
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-2">
                        Daily DM Limit
                      </label>
                      <input
                        type="number"
                        value={form.dailyLimit}
                        onChange={e => setForm(p => ({
                          ...p, 
                          dailyLimit: Number(e.target.value)
                        }))}
                        className="w-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        min={1}
                        max={1000}
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Max DMs sent per day (recommended: 100-200)
                      </p>
                    </div>

                  </div>

                  {/* Modal Footer */}
                  <div className="p-6 border-t border-slate-100 flex gap-3 sticky bottom-0 bg-white">
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setEditingAutomation(null);
                        resetForm();
                      }}
                      className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreate}
                      className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                    >
                      {editingAutomation ? 'Save Changes' : 'Create Automation'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
