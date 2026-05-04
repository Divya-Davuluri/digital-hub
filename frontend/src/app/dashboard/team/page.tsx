'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";

export default function TeamDashboard() {
  const router = useRouter();
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

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="team" />
      <div className="flex-1 ml-[260px] flex flex-col">
        <Header />
        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-slate-900">Assigned Workspace</h1>
            <p className="text-sm text-slate-500 mt-1">Manage campaigns and performance for your assigned clients.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            <StatCard 
              label="Assigned Clients" 
              value={stats?.totalClients || 0} 
              icon="👥" 
              onClick={() => router.push('/dashboard/team/clients')}
            />
            <StatCard 
              label="Project Pipeline" 
              value={stats?.activeCampaigns || 0} 
              icon="📊" 
              onClick={() => router.push('/projects')}
            />
            <StatCard 
              label="Pending Tasks" 
              value="8" 
              icon="✅" 
              onClick={() => router.push('/dashboard/team/tasks')}
            />
          </div>

          <div className="card !p-0 overflow-hidden">
             <div className="p-6 border-b border-border flex justify-between items-center">
                <h3 className="text-base font-bold">Assigned Client List</h3>
                <button onClick={() => router.push('/dashboard/team/clients')} className="text-xs font-bold text-indigo-600 hover:underline">View All</button>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                      <tr>
                         <th className="px-6 py-3">Client</th>
                         <th className="px-6 py-3">Status</th>
                         <th className="px-6 py-3">Last Active</th>
                         <th className="px-6 py-3 text-right">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50">
                         <td className="px-6 py-4 font-semibold text-sm">Nike Marketing</td>
                         <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold">Active</span></td>
                         <td className="px-6 py-4 text-xs text-slate-500">2 mins ago</td>
                         <td className="px-6 py-4 text-right"><button className="text-xs font-bold text-indigo-600 hover:underline">Manage</button></td>
                      </tr>
                   </tbody>
                </table>
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className="card flex items-center gap-4 cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all active:scale-[0.98]"
    >
      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-xl">{icon}</div>
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <h2 className="text-2xl font-bold text-slate-900">{value}</h2>
      </div>
    </div>
  );
}
