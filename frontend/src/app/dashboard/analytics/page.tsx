'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import RoleGuard from '@/components/RoleGuard';
import ClientSelector from '@/components/ClientSelector';
import PeriodSelector from '@/components/PeriodSelector';
import { apiCall } from '@/lib/api';
import { 
  BarChart as _BarChart, Bar as _Bar, LineChart as _LineChart, Line as _Line, 
  XAxis as _XAxis, YAxis as _YAxis, CartesianGrid as _CartesianGrid, 
  Tooltip as _Tooltip, Legend as _Legend, ResponsiveContainer as _ResponsiveContainer,
  PieChart as _PieChart, Pie as _Pie, Cell as _Cell
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, MousePointer2, 
  Target, BarChart3, Download, Activity, Globe, Mail, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// Recharts type fixes
const BarChart = _BarChart as any;
const Bar = _Bar as any;
const LineChart = _LineChart as any;
const Line = _Line as any;
const XAxis = _XAxis as any;
const YAxis = _YAxis as any;
const CartesianGrid = _CartesianGrid as any;
const Tooltip = _Tooltip as any;
const Legend = _Legend as any;
const ResponsiveContainer = _ResponsiveContainer as any;
const PieChart = _PieChart as any;
const Pie = _Pie as any;
const Cell = _Cell as any;

export default function AnalyticsPage() {
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [branding, setBranding] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBranding();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchAnalytics();
    } else {
      setOverview(null);
      setTimeseries([]);
      setChannels([]);
      setCampaigns([]);
    }
  }, [selectedClient, selectedPeriod]);

  const fetchBranding = async () => {
    try {
      const data = await apiCall('/branding');
      if (data) setBranding(data);
    } catch (err) {
      console.error('Failed to fetch branding', err);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [overRes, timeRes, chanRes, campRes] = await Promise.all([
        apiCall(`/analytics/overview?clientId=${selectedClient}&period=${selectedPeriod}`),
        apiCall(`/analytics/timeseries?clientId=${selectedClient}&period=${selectedPeriod}`),
        apiCall(`/analytics/channels?clientId=${selectedClient}&period=${selectedPeriod}`),
        apiCall(`/analytics/campaigns?clientId=${selectedClient}&period=${selectedPeriod}`)
      ]);
      
      if (overRes?.success) setOverview(overRes.data || null);
      if (timeRes?.success) setTimeseries(timeRes.data || []);
      if (chanRes?.success) setChannels(chanRes.data || []);
      if (campRes?.success) setCampaigns(campRes.data || []);
      
    } catch (err) {
      console.error('Failed to fetch analytics', err);
      toast.error('Failed to load analytics data');
      // Reset on error to prevent inconsistent state
      setOverview(null);
      setTimeseries([]);
      setChannels([]);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedClient) {
      toast.error('Please select a client first');
      return;
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/analytics/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          clientId: selectedClient,
          period: selectedPeriod,
          metrics: overview
        })
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Analytics_Report_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to export report');
    }
  };

  return (
    <RoleGuard allowedRoles={['admin', 'team']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8 max-w-[1400px] mx-auto space-y-8">
            
            {/* Header Section */}
            <div className="flex justify-between items-end">
              <div>
                {branding?.logoUrl && <img src={branding.logoUrl} alt="Logo" className="h-8 mb-4 object-contain" />}
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics Dashboard</h1>
                <p className="text-slate-500 mt-1 font-medium">Track performance across all channels</p>
              </div>
              <div className="flex items-center gap-4">
                <ClientSelector onSelect={setSelectedClient} />
                <PeriodSelector onSelect={setSelectedPeriod} />
                <button 
                  onClick={handleExport}
                  disabled={loading || !selectedClient}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <Download size={18} /> Export Report
                </button>
              </div>
            </div>

            {loading && !overview ? (
              <div className="animate-pulse space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-3xl border border-slate-200" />)}
                </div>
                <div className="h-80 bg-white rounded-3xl border border-slate-200" />
              </div>
            ) : !selectedClient ? (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-24 text-center flex flex-col items-center gap-6 shadow-sm">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
                  <Target size={48} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Select a Client to Begin</h3>
                  <p className="text-slate-500 max-w-sm font-medium mx-auto">Choose a client from the dropdown above to view their performance metrics and analytics dashboard.</p>
                </div>
              </div>
            ) : (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  <KpiCard 
                    title="Total Spent" 
                    value={`$${Number(overview?.totalSpent || 0).toLocaleString()}`} 
                    change={overview?.spentChange || 0} 
                    icon={<DollarSign size={20} />} 
                    color="red" 
                  />
                  <KpiCard 
                    title="Total Revenue" 
                    value={`$${Number(overview?.totalRevenue || 0).toLocaleString()}`} 
                    change={overview?.revenueChange || 0} 
                    icon={<Activity size={20} />} 
                    color="green" 
                  />
                  <KpiCard 
                    title="Total Clicks" 
                    value={Number(overview?.totalClicks || 0).toLocaleString()} 
                    change={overview?.clicksChange || 0} 
                    icon={<MousePointer2 size={20} />} 
                    color="indigo" 
                  />
                  <KpiCard 
                    title="Avg ROAS" 
                    value={`${overview?.avgROAS || '0.0'}x`} 
                    change={overview?.roasChange || 0} 
                    icon={<Target size={20} />} 
                    color="amber" 
                    isROAS 
                  />
                </div>

                {/* Timeseries Chart */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-slate-900">Performance Over Time</h3>
                    <div className="flex gap-4 text-xs font-bold text-slate-400">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /> Spent</div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Revenue</div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-indigo-500" /> Clicks</div>
                    </div>
                  </div>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeseries || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v: any) => `$${v}`} />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Line yAxisId="left" type="monotone" dataKey="spent" stroke="#EF4444" strokeWidth={3} dot={false} />
                        <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="clicks" stroke="#6366F1" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Breakdown Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    <h3 className="text-xl font-black text-slate-900 mb-8">Channel Distribution</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={channels || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="spent"
                          >
                            {(channels || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    <h3 className="text-xl font-black text-slate-900 mb-8">Conversions by Channel</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={channels || []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="channel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} />
                          <Bar dataKey="conversions" radius={[6, 6, 0, 0]}>
                            {(channels || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Campaign Table */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-100">
                    <h3 className="font-black text-slate-900">Campaign Performance</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Campaign</th>
                          <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Budget</th>
                          <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Spent</th>
                          <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">ROAS</th>
                          <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">CTR</th>
                          <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">CVR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(campaigns || []).map((camp: any) => (
                          <tr key={camp.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-4 font-bold text-slate-900">{camp.name}</td>
                            <td className="px-8 py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                                camp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 
                                camp.status === 'PAUSED' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {camp.status}
                              </span>
                            </td>
                            <td className="px-8 py-4 text-sm font-bold text-slate-900">${Number(camp.budget || 0).toLocaleString()}</td>
                            <td className="px-8 py-4 text-right">
                              <div className="flex flex-col items-end gap-1.5">
                                <span className="text-sm font-bold text-slate-900">${Number(camp.spent || 0).toLocaleString()}</span>
                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-indigo-500" 
                                    style={{ width: `${Math.min(100, (Number(camp.spent || 0) / (Number(camp.budget || 1))) * 100)}%` }} 
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-4 text-center font-black">
                              <span className={
                                Number(camp.roas || 0) > 4 ? 'text-emerald-600' : 
                                Number(camp.roas || 0) > 2 ? 'text-amber-600' : 'text-red-600'
                              }>
                                {camp.roas || '0.0'}x
                              </span>
                            </td>
                            <td className="px-8 py-4 text-center text-sm font-medium text-slate-600">{camp.ctr || '0.00'}%</td>
                            <td className="px-8 py-4 text-center text-sm font-medium text-slate-600">{camp.cvr || '0.00'}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {branding?.removePoweredBy === 0 && (
              <footer className="text-center py-8">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                  Powered by {branding?.agencyName || 'Digital Hub'}
                </p>
              </footer>
            )}

          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

function KpiCard({ title, value, change, icon, color, isROAS = false }: any) {
  const isPositive = Number(change || 0) >= 0;
  const colors: any = {
    red: 'bg-red-50 text-red-600',
    green: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colors[color] || 'bg-slate-50 text-slate-600'}`}>{icon}</div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${
          isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
        }`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {isPositive ? '+' : ''}{change}{isROAS ? 'x' : '%'}
        </div>
      </div>
      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-2xl font-black text-slate-900">{value}</h4>
      </div>
    </div>
  );
}
