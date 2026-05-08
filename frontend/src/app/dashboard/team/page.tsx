'use client';

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";
import apiCall from "@/lib/api";

export default function TeamDashboard() {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeCampaigns: 0,
    pendingReports: 3, // Mocked for now
    teamTasks: 12     // Mocked for now
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiCall("/agency/stats");
        setStats(prev => ({
          ...prev,
          totalClients: data.totalClients || 0,
          activeCampaigns: data.activeCampaigns || 0
        }));
      } catch (err) {
        console.error("Failed to fetch team stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <RoleGuard allowedRoles={['team', 'admin']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="team" />
        <div className="flex-1 ml-[260px] flex flex-col">
          <Header />
          <main className="p-8 max-w-7xl mx-auto w-full">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Team Workspace</h1>
              <p className="text-sm text-slate-500 mt-1">Manage your assigned clients and active campaigns.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <StatCard label="Assigned Clients" value={stats.totalClients.toString()} icon="👥" color="blue" />
              <StatCard label="Active Campaigns" value={stats.activeCampaigns.toString()} icon="🚀" color="indigo" />
              <StatCard label="Pending Reports" value={stats.pendingReports.toString()} icon="📄" color="amber" />
              <StatCard label="Team Tasks" value={stats.teamTasks.toString()} icon="✅" color="emerald" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="card">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900">Recent Tasks</h3>
                    <button className="text-xs font-bold text-indigo-600">View All</button>
                  </div>
                  <div className="space-y-4">
                    <TaskItem title="Upload April Reports" client="Global Tech" priority="high" />
                    <TaskItem title="Audit Campaign Budget" client="Nike Europe" priority="medium" />
                    <TaskItem title="Client Onboarding Call" client="New Media Ltd" priority="high" />
                  </div>
               </div>

               <div className="card">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900">Quick Actions</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <ActionButton icon="➕" label="New Campaign" color="indigo" />
                    <ActionButton icon="📝" label="New Report" color="blue" />
                    <ActionButton icon="📂" label="Client Docs" color="slate" />
                    <ActionButton icon="💬" label="Team Chat" color="emerald" />
                  </div>
               </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

function StatCard({ label, value, icon, color }: any) {
  const colorMap: any = {
    blue: 'bg-blue-500/10 text-blue-600',
    indigo: 'bg-indigo-500/10 text-indigo-600',
    amber: 'bg-amber-500/10 text-amber-600',
    emerald: 'bg-emerald-500/10 text-emerald-600'
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-4 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <h2 className="text-2xl font-bold text-slate-900">{value}</h2>
    </div>
  );
}

function TaskItem({ title, client, priority }: any) {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100 group">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${priority === 'high' ? 'bg-red-500' : 'bg-amber-500'}`} />
        <div>
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{client}</p>
        </div>
      </div>
      <button className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-900 transition-all">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
}

function ActionButton({ icon, label, color }: any) {
  return (
    <button className="flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all hover:shadow-md group">
      <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600">{label}</span>
    </button>
  );
}
