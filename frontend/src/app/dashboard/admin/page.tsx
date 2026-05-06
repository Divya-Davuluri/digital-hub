'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { getDashboardSummary, getDashboardStats, exportReport, DashboardSummary, ChannelStat } from "@/services/dashboardService";
import { useBranding } from "@/context/BrandingContext";

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
    <div className="flex min-h-screen bg-[#020617] text-white selection:bg-primary/30">
      <Sidebar role="admin" />
      
      <div className="flex-1 ml-[280px] min-h-screen bg-grid relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <Header />
        
        <main className="p-10 max-w-[1600px] mx-auto relative z-10 animate-fade-in">
          <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">Executive Suite</span>
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time Analytics</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white italic">
                Agency <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Intelligence</span>
              </h1>
              <p className="text-slate-400 font-medium max-w-xl text-lg">Centralized command for your agency's performance metrics and client synchronization.</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="btn-secondary !px-6 !py-3 flex items-center gap-3 shadow-2xl group"
              >
                <svg className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span className="uppercase text-xs tracking-widest font-black">Export Data</span>
              </button>
              <button 
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                style={{ backgroundColor: branding?.primaryColor }}
                className="btn-primary !px-8 !py-3 flex items-center gap-3 shadow-2xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span className="uppercase text-xs tracking-widest font-black">Generate Report</span>
              </button>
            </div>
          </header>

          {/* KPI Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <KpiCard 
              title="Global Spend" 
              value={`$${summary?.totalSpend.toLocaleString()}`} 
              trend="+12.5%" 
              icon="💰"
              delay="0s"
            />
            <KpiCard 
              title="Conversions" 
              value={summary?.totalConversions.toLocaleString()} 
              trend="+8.2%" 
              icon="🎯"
              delay="0.1s"
            />
            <KpiCard 
              title="Return on Ad Spend" 
              value={`${summary?.avgRoas.toFixed(2)}x`} 
              trend="+4.1%" 
              icon="📈"
              delay="0.2s"
            />
            <KpiCard 
              title="Active Initiatives" 
              value={summary?.activeCampaigns} 
              trend="Steady" 
              icon="🚀"
              delay="0.3s"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Channel Performance Chart */}
            <div className="lg:col-span-2 card p-10 relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                 <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
              </div>
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Channel Efficiency</h3>
                <div className="flex gap-2">
                   <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                   <div className="w-2 h-2 rounded-full bg-slate-800" />
                </div>
              </div>
              <div className="space-y-10">
                {stats.map((stat, i) => (
                  <div key={stat.channel} className="relative group/stat">
                    <div className="flex justify-between text-sm mb-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-lg border border-white/5 group-hover/stat:border-primary/50 transition-colors">
                          {stat.channel.toLowerCase().includes('google') ? '🔍' : stat.channel.toLowerCase().includes('face') ? '📱' : '🔗'}
                        </span>
                        <span className="capitalize font-black tracking-widest text-xs text-slate-300">{stat.channel}</span>
                      </div>
                      <span className="text-white font-black tracking-widest text-xs">${stat.spend.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-white/[0.03] h-2.5 rounded-full overflow-hidden p-[2px] border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.4)]" 
                        style={{ 
                          width: `${(stat.spend / (summary?.totalSpend || 1)) * 100}%`,
                          transitionDelay: `${i * 100}ms`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions / Recent Activity */}
            <div className="space-y-8">
               <div className="card p-8 border-primary/10">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-8">Rapid Protocol</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <ActionCard title="Onboard Client" icon="👤" desc="Register new workspace" onClick={() => router.push('/dashboard/admin/clients')} />
                    <ActionCard title="Brand Identity" icon="🎨" desc="Update visual assets" onClick={() => router.push('/dashboard/admin/branding')} />
                    <ActionCard title="Deployment" icon="🚀" desc="Launch new campaigns" onClick={() => router.push('/projects')} />
                    <ActionCard title="System Config" icon="⚙️" desc="Manage platform settings" onClick={() => router.push('/settings')} />
                  </div>
               </div>
               
               <div className="glass-panel p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] -mr-16 -mt-16" />
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Network Status</h4>
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Database Sync</span>
                     <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Synchronized</span>
                  </div>
               </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function KpiCard({ title, value, trend, icon, delay }: any) {
  return (
    <div className="card p-8 relative overflow-hidden group" style={{ animationDelay: delay }}>
      <div className="absolute top-0 right-0 p-6 text-3xl opacity-20 group-hover:opacity-40 group-hover:scale-125 transition-all duration-500">{icon}</div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">{title}</p>
      <div className="flex items-end justify-between relative z-10">
        <h2 className="text-4xl font-black tracking-tighter text-white italic">{value}</h2>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${trend.includes('+') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
          {trend.includes('+') && <span className="text-[8px]">▲</span>}
          {trend}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

function ActionCard({ title, icon, desc, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-5 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-primary/30 transition-all duration-300 text-left group"
    >
      <span className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-xl text-2xl group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500 shadow-inner">
        {icon}
      </span>
      <div>
        <span className="block font-black text-sm text-white uppercase tracking-widest group-hover:text-primary transition-colors">{title}</span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 block">{desc}</span>
      </div>
      <div className="ml-auto opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
         <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
      </div>
    </button>
  );
}
