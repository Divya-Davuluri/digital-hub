'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch("/agency/stats");
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-slate-500">Loading Agency Overview...</div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="admin" />
      <div className="flex-1 ml-[260px] flex flex-col">
        <Header />
        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-slate-900">Agency Admin Console</h1>
            <p className="text-sm text-slate-500 mt-1">Manage all clients, team members, and platform performance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard label="Total Clients" value={stats?.totalClients || 0} trend="+3" icon="🏢" />
            <StatCard label="Active Campaigns" value={stats?.activeCampaigns || 0} trend="+12%" icon="🚀" />
            <StatCard label="Total Agency Spend" value={`$${(stats?.totalBudget || 0).toLocaleString()}`} trend="+24%" icon="💰" />
            <StatCard label="Platform ROI" value="4.2x" trend="+0.3" icon="📈" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card">
               <h3 className="text-base font-bold mb-6">Recent Client Activity</h3>
               <div className="space-y-4">
                  <ActivityItem user="Nike" action="Launched 'Summer Blitz' Campaign" time="2h ago" />
                  <ActivityItem user="Tesla" action="Added 3 new team members" time="5h ago" />
                  <ActivityItem user="BlueBottle" action="Report generated successfully" time="1d ago" />
               </div>
            </div>
            <div className="card">
               <h3 className="text-base font-bold mb-6">Global Performance Trend</h3>
               <div className="h-64 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                  Analytics Chart Placeholder
               </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, icon }: any) {
  return (
    <div className="card flex flex-col gap-1 hover:border-indigo-200 transition-all cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-[10px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded">{trend}</span>
      </div>
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <h2 className="text-2xl font-bold text-slate-900">{value}</h2>
    </div>
  );
}

function ActivityItem({ user, action, time }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-none">
      <div>
        <p className="text-sm font-semibold text-slate-900">{user}</p>
        <p className="text-xs text-slate-500">{action}</p>
      </div>
      <span className="text-[10px] text-slate-400 font-medium">{time}</span>
    </div>
  );
}
