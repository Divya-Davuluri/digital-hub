'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import RoleGuard from '@/components/RoleGuard';
import { apiCall } from '@/lib/api';
import { 
  DollarSign, Activity, Settings2, Plus, 
  BarChart2, Play, Pause, ChevronRight, X, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { BarChart as _BarChart, Bar as _Bar, XAxis as _XAxis, YAxis as _YAxis, Tooltip as _Tooltip, ResponsiveContainer as _ResponsiveContainer, Legend as _Legend, Cell } from 'recharts';
import toast from 'react-hot-toast';

const BarChart = _BarChart as any;
const Bar = _Bar as any;
const XAxis = _XAxis as any;
const YAxis = _YAxis as any;
const Tooltip = _Tooltip as any;
const ResponsiveContainer = _ResponsiveContainer as any;
const Legend = _Legend as any;

export default function BudgetPage() {
  const [pools, setPools] = useState<any[]>([]);
  const [selectedPool, setSelectedPool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReallocateModalOpen, setIsReallocateModalOpen] = useState(false);
  const [reallocationPreview, setReallocationPreview] = useState<any[]>([]);
  
  // Create Form State
  const [form, setForm] = useState({
    name: '',
    workspaceId: '',
    clientId: '',
    totalBudget: '',
    period: 'monthly',
    startDate: '',
    endDate: '',
    channels: [] as string[],
    autoReallocate: true
  });
  const [clientsData, setClientsData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [poolsData, clientsRes] = await Promise.all([
        apiCall('/budget/pools'),
        apiCall('/clients')
      ]);
      setPools(poolsData);
      setClientsData(clientsRes);
      
      // Update selected pool if it exists
      if (selectedPool) {
        const updatedSelected = poolsData.find((p: any) => p.id === selectedPool.id);
        if (updatedSelected) setSelectedPool(updatedSelected);
      }
    } catch (err) {
      console.error('Failed to load budget data:', err);
      toast.error('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch(channel.toLowerCase()) {
      case 'meta': return <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">f</div>;
      case 'tiktok': return <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">tik</div>;
      case 'google': return <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">G</div>;
      default: return <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">{channel.substring(0, 2).toUpperCase()}</div>;
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 6) return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">{score.toFixed(1)}</span>;
    if (score >= 3) return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold">{score.toFixed(1)}</span>;
    return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">{score.toFixed(1)}</span>;
  };

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.workspaceId || !form.name || !form.totalBudget || form.channels.length === 0) {
      toast.error('Please fill all required fields and select at least one channel');
      return;
    }
    try {
      await apiCall('/budget/pools', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          totalBudget: Number(form.totalBudget)
        })
      });
      toast.success('Budget pool created');
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to create pool');
    }
  };

  const toggleChannelSelection = (ch: string) => {
    setForm(prev => ({
      ...prev,
      channels: prev.channels.includes(ch) 
        ? prev.channels.filter(c => c !== ch)
        : [...prev.channels, ch]
    }));
  };

  const previewReallocation = async (poolId: string) => {
    try {
      const res = await apiCall(`/budget/pools/${poolId}/reallocate`, { method: 'POST' });
      if (res.changes && res.changes.length > 0) {
        setReallocationPreview(res.changes);
        setIsReallocateModalOpen(true);
      } else {
        toast.error(res.message || 'No reallocation possible');
      }
    } catch (err) {
      toast.error('Failed to calculate reallocation');
    }
  };

  const confirmReallocation = async () => {
    setIsReallocateModalOpen(false);
    toast.success('Budget optimally reallocated across channels');
    fetchData(); // Refresh data
  };

  const toggleAutoAdjust = async (allocationId: string, currentVal: number) => {
    try {
      await apiCall(`/budget/allocations/${allocationId}`, {
        method: 'PUT',
        body: JSON.stringify({ autoAdjust: currentVal === 1 ? 0 : 1 })
      });
      fetchData();
    } catch (err) {
      toast.error('Failed to update toggle');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 pl-[260px]">
          <Header />
          <div className="p-8 animate-pulse">Loading budget engine...</div>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin', 'team']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 pl-[260px] overflow-hidden flex flex-col h-screen">
          <Header />
          <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
            
            {/* SECTION A: Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Budget Management</h1>
                <p className="text-slate-500 mt-1">Automate and optimise ad spend across channels</p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <Plus size={18} /> Create Budget Pool
              </button>
            </div>

            {/* SECTION B: Budget Pools List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
              {pools.map(pool => {
                const spentPercent = Math.min(100, Math.round((pool.summary.totalSpent / pool.totalBudget) * 100)) || 0;
                
                return (
                  <div key={pool.id} className={`bg-white rounded-3xl p-6 border transition-all ${selectedPool?.id === pool.id ? 'border-indigo-500 shadow-md ring-2 ring-indigo-50' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{pool.period}</div>
                        <h3 className="font-bold text-slate-900">{pool.name}</h3>
                      </div>
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${pool.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                        {pool.status.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="text-3xl font-black text-slate-900 mb-1">
                        ${pool.totalBudget.toLocaleString()}
                      </div>
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                        <span>${pool.summary.totalSpent.toLocaleString()} spent</span>
                        <span>{spentPercent}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${spentPercent}%` }} />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => previewReallocation(pool.id)}
                        className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-1"
                      >
                        <Settings2 size={14} /> Reallocate Now
                      </button>
                      <button 
                        onClick={() => setSelectedPool(pool)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${selectedPool?.id === pool.id ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SECTIONS C & D: Detail View & Chart */}
            {selectedPool && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{selectedPool.name} - Engine view</h2>
                    <p className="text-sm text-slate-500">Performance-based allocation distribution</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8">
                  {/* Left: Table */}
                  <div className="col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Channel</th>
                          <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Allocated</th>
                          <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Spent</th>
                          <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">ROAS</th>
                          <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Score</th>
                          <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Auto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {selectedPool.allocations.map((alloc: any) => (
                          <tr key={alloc.id} className="hover:bg-slate-50/50">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {getChannelIcon(alloc.channel)}
                                <span className="font-bold text-sm text-slate-900 capitalize">{alloc.channel}</span>
                              </div>
                            </td>
                            <td className="p-4 text-right font-bold text-sm text-slate-900">${(alloc.allocatedAmount || 0).toLocaleString()}</td>
                            <td className="p-4 text-right font-bold text-sm text-slate-500">${(alloc.spentAmount || 0).toLocaleString()}</td>
                            <td className="p-4 text-center font-bold text-sm text-slate-700">{alloc.roas?.toFixed(1)}x</td>
                            <td className="p-4 text-center">{getScoreBadge(alloc.performanceScore || 0)}</td>
                            <td className="p-4 text-center">
                              <button 
                                onClick={() => toggleAutoAdjust(alloc.id, alloc.autoAdjust)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${alloc.autoAdjust ? 'bg-indigo-500' : 'bg-slate-200'}`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${alloc.autoAdjust ? 'translate-x-6' : 'translate-x-1'}`} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Right: Chart */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col">
                    <h3 className="font-bold text-slate-900 mb-6">Allocation vs Spent</h3>
                    <div className="flex-1 min-h-[250px]">
                      {/* @ts-ignore */}
                      <ResponsiveContainer width="100%" height="100%">
                        {/* @ts-ignore */}
                        <BarChart data={selectedPool.allocations} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <XAxis dataKey="channel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} style={{ textTransform: 'capitalize' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val: number) => `$${val/1000}k`} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }} 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any) => [`$${Number(value).toLocaleString()}`, undefined]}
                          />
                          {/* @ts-ignore */}
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                          <Bar dataKey="allocatedAmount" name="Allocated" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="spentAmount" name="Spent" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION E: Reallocation Modal */}
            {isReallocateModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Allocation Preview</h2>
                      <p className="text-sm text-slate-500 mt-1">Proposed budget shifts based on ROAS, CTR, and CVR</p>
                    </div>
                    <button onClick={() => setIsReallocateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                  </div>
                  <div className="p-8">
                    <div className="space-y-4 mb-8">
                      {reallocationPreview.map((ch: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3 w-1/4">
                            {getChannelIcon(ch.channel)}
                            <span className="font-bold text-slate-900 capitalize">{ch.channel}</span>
                          </div>
                          <div className="w-1/4 text-center">
                            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Before</div>
                            <div className="font-bold text-slate-600">${ch.before.toLocaleString()}</div>
                          </div>
                          <div className="w-1/4 text-center">
                            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">After</div>
                            <div className="font-bold text-slate-900">${ch.after.toLocaleString()}</div>
                          </div>
                          <div className="w-1/4 flex justify-end">
                            {ch.change > 0 ? (
                              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl text-sm font-bold">
                                <ArrowUpRight size={16} /> +${ch.change.toLocaleString()}
                              </div>
                            ) : ch.change < 0 ? (
                              <div className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1.5 rounded-xl text-sm font-bold">
                                <ArrowDownRight size={16} /> -${Math.abs(ch.change).toLocaleString()}
                              </div>
                            ) : (
                              <div className="text-slate-400 text-sm font-bold">No change</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => setIsReallocateModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
                      <button onClick={confirmReallocation} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">Confirm Reallocation</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION F: Create Pool Modal */}
            {isCreateModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-black text-slate-900">Create Budget Pool</h2>
                    <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                  </div>
                  <form onSubmit={handleCreatePool} className="p-8 space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Pool Name</label>
                      <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Q3 Growth Budget" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Workspace</label>
                        <select required value={form.workspaceId} onChange={e => {
                          const wId = e.target.value;
                          const client = clientsData.find(c => c.workspace_id === wId);
                          setForm({...form, workspaceId: wId, clientId: client?.id || ''});
                        }} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                          <option value="">Select Workspace</option>
                          {clientsData.map(c => (
                            <option key={c.id} value={c.workspace_id || c.workspaceId}>{c.companyName || c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Budget</label>
                        <input type="number" required min="1" value={form.totalBudget} onChange={e => setForm({...form, totalBudget: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="$0.00" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Advertising Channels</label>
                      <div className="flex flex-wrap gap-3">
                        {['meta', 'tiktok', 'google', 'snapchat', 'pinterest'].map(ch => (
                          <button 
                            key={ch} type="button" onClick={() => toggleChannelSelection(ch)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all capitalize ${form.channels.includes(ch) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                          >
                            {ch}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all mt-4">
                      Create Pool
                    </button>
                  </form>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
