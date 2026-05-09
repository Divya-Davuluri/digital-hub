'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";
import apiCall from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface AnalyticsSummary {
  totalImpressions: number;
  totalClicks: number;
  totalSpend: number;
  totalConversions: number;
  avgRoas: number;
  activeCampaigns: number;
}

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
                   <h3 className="text-lg font-bold text-slate-900">Conversion Funnel</h3>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Last 30 Days</span>
                </div>
                <div className="h-[300px] flex items-end gap-4">
                   {/* Mock Visual Funnel */}
                   <div className="flex-1 bg-slate-50 rounded-t-2xl flex flex-col justify-end p-4 group hover:bg-indigo-50 transition-colors">
                      <div className="bg-indigo-200 w-full rounded-t-lg transition-all group-hover:bg-indigo-400" style={{ height: '90%' }}></div>
                      <p className="text-[10px] font-bold text-center mt-3 text-slate-400 uppercase tracking-tighter">Reach</p>
                   </div>
                   <div className="flex-1 bg-slate-50 rounded-t-2xl flex flex-col justify-end p-4 group hover:bg-blue-50 transition-colors">
                      <div className="bg-blue-200 w-full rounded-t-lg transition-all group-hover:bg-blue-400" style={{ height: '45%' }}></div>
                      <p className="text-[10px] font-bold text-center mt-3 text-slate-400 uppercase tracking-tighter">Engage</p>
                   </div>
                   <div className="flex-1 bg-slate-50 rounded-t-2xl flex flex-col justify-end p-4 group hover:bg-emerald-50 transition-colors">
                      <div className="bg-emerald-200 w-full rounded-t-lg transition-all group-hover:bg-emerald-400" style={{ height: '15%' }}></div>
                      <p className="text-[10px] font-bold text-center mt-3 text-slate-400 uppercase tracking-tighter">Convert</p>
                   </div>
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
