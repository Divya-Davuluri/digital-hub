'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";
import { getDashboardSummary, getDashboardStats, exportReport, DashboardSummary, ChannelStat } from "@/services/dashboardService";
import { useBranding } from "@/context/BrandingContext";

import dynamic from 'next/dynamic';

const ResponsiveContainer = dynamic<any>(() => import('recharts').then(mod => mod.ResponsiveContainer) as any, { ssr: false });
import { 
  BarChart as RechartsBarChart, Bar as RechartsBar, XAxis as RechartsXAxis, YAxis as RechartsYAxis, 
  CartesianGrid as RechartsCartesianGrid, Tooltip as RechartsTooltip, Cell as RechartsCell,
  AreaChart as RechartsAreaChart, Area as RechartsArea
} from 'recharts';

const BarChart = RechartsBarChart as any;
const Bar = RechartsBar as any;
const XAxis = RechartsXAxis as any;
const YAxis = RechartsYAxis as any;
const CartesianGrid = RechartsCartesianGrid as any;
const Tooltip = RechartsTooltip as any;
const Cell = RechartsCell as any;
const AreaChart = RechartsAreaChart as any;
const Area = RechartsArea as any;

export default function AdminDashboard() {
  const router = useRouter();
  const { branding } = useBranding();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [stats, setStats] = useState<ChannelStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryData, statsData] = await Promise.all([
          getDashboardSummary(),
          getDashboardStats()
        ]);
        setSummary(summaryData);
        setStats(statsData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExporting(true);
    try {
      await exportReport(format);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const primaryColor = branding?.primaryColor || '#4f46e5';

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="flex min-h-screen" style={{ background: '#f9fafb', minHeight: '100vh' }}>
        <Sidebar role="admin" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-slate-500">Overview of all client performance and agency health.</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Export CSV
                </button>
                <button 
                  onClick={() => handleExport('pdf')}
                  disabled={exporting}
                  style={{ backgroundColor: primaryColor }}
                  className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Export PDF
                </button>
              </div>
            </div>

            {/* KPI Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <KpiCard title="Total Spend" value={`$${(summary?.totalSpend || 0).toLocaleString()}`} trend="+12.5%" />
              <KpiCard title="Conversions" value={(summary?.totalConversions || 0).toLocaleString()} trend="+8.2%" />
              <KpiCard title="Avg ROAS" value={`${(summary?.avgRoas || 0).toFixed(2)}x`} trend="+4.1%" />
              <KpiCard title="Active Campaigns" value={summary?.activeCampaigns || 0} trend="Steady" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Channel Performance Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold mb-6">Channel Performance</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="channel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value: number) => `$${value/1000}k`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#f8fafc' }}
                      />
                      <Bar dataKey="spend" radius={[6, 6, 0, 0]} barSize={40}>
                        {Array.isArray(stats) && stats.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? primaryColor : `${primaryColor}aa`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold mb-6">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <ActionCard title="Add Client" icon="👥" onClick={() => router.push('/dashboard/admin/clients')} />
                  <ActionCard title="Branding" icon="🎨" onClick={() => router.push('/dashboard/admin/branding')} />
                  <ActionCard title="Campaigns" icon="🚀" onClick={() => router.push('/dashboard/admin/campaigns')} />
                  <ActionCard title="Settings" icon="⚙️" onClick={() => router.push('/dashboard/admin/settings')} />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

function KpiCard({ title, value, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <div className="flex items-baseline justify-between mt-2">
        <h2 className="text-2xl font-bold text-slate-900">{value}</h2>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.includes('+') ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600'}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}

function ActionCard({ title, icon, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="p-4 border border-slate-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-left group"
    >
      <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">{icon}</span>
      <span className="font-bold text-slate-900">{title}</span>
    </button>
  );
}
