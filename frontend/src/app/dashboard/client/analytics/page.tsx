'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";
import apiCall from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import dynamic from 'next/dynamic';

const ResponsiveContainer = dynamic<any>(() => import('recharts').then(mod => mod.ResponsiveContainer) as any, { ssr: false });
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';

interface AnalyticsSummary {
  totalImpressions: number;
  totalClicks: number;
  totalSpend: number;
  totalConversions: number;
  avgRoas: number;
  activeCampaigns: number;
}

const mockTrendData = [
  { name: 'Mon', spend: 400, conv: 24 },
  { name: 'Tue', spend: 300, conv: 13 },
  { name: 'Wed', spend: 200, conv: 98 },
  { name: 'Thu', spend: 278, conv: 39 },
  { name: 'Fri', spend: 189, conv: 48 },
  { name: 'Sat', spend: 239, conv: 38 },
  { name: 'Sun', spend: 349, conv: 43 },
];

export default function ClientAnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await apiCall(`/api/dashboard/summary?workspaceId=${user?.workspaceId}`);
        setData(res);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.workspaceId) fetchAnalytics();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="client" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <div className="p-8 text-center py-24 text-slate-400 italic">Syncing performance data...</div>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['client', 'admin']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="client" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8 max-w-7xl mx-auto w-full">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Deep Analytics</h1>
              <p className="text-slate-500">Advanced performance breakdowns and ROI tracking.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <AnalyticsCard title="Total Spend" value={`$${data?.totalSpend.toLocaleString()}`} icon="💰" color="bg-emerald-50 text-emerald-600" />
              <AnalyticsCard title="Impressions" value={data?.totalImpressions.toLocaleString() || '0'} icon="👁️" color="bg-blue-50 text-blue-600" />
              <AnalyticsCard title="Clicks" value={data?.totalClicks.toLocaleString() || '0'} icon="🖱️" color="bg-indigo-50 text-indigo-600" />
              <AnalyticsCard title="ROAS" value={`${data?.avgRoas}x`} icon="🚀" color="bg-purple-50 text-purple-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 card">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-lg font-bold text-slate-900">Performance Trends</h3>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Last 7 Days</span>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockTrendData}>
                      <defs>
                        <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="spend" stroke="#4f46e5" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Efficiency metrics</h3>
                <div className="space-y-6">
                   <MetricRow label="Cost per Click" value={`$${(Number(data?.totalSpend || 0) / (data?.totalClicks || 1)).toFixed(2)}`} />
                   <MetricRow label="Cost per Conv." value={`$${(Number(data?.totalSpend || 0) / (data?.totalConversions || 1)).toFixed(2)}`} />
                   <MetricRow label="Conv. Rate" value={`${((Number(data?.totalConversions || 0) / (data?.totalClicks || 1)) * 100).toFixed(2)}%`} />
                   <MetricRow label="Avg. Order Value" value="$125.00" />
                </div>
                <div className="mt-10 p-4 bg-slate-900 rounded-2xl">
                   <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Active Campaigns</p>
                   <p className="text-2xl font-bold text-white">{data?.activeCampaigns}</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

function AnalyticsCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-lg mb-4`}>
        {icon}
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function MetricRow({ label, value }: any) {
  return (
    <div className="flex justify-between items-center pb-4 border-b border-slate-50 last:border-0 last:pb-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
}
