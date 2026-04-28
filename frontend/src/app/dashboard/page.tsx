'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";

interface DashboardData {
  totalCampaigns: number;
  activeUsers: number;
  revenue: number;
  performance: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (!token) {
      router.push("/login");
      return;
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const fetchDashboard = async () => {
      try {
        const dashboardData = await apiFetch("/dashboard");
        setData(dashboardData);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setShowToast({ show: true, message, type });
    setTimeout(() => setShowToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleExport = () => {
    console.log("Export button clicked");
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      triggerToast("Performance report successfully generated and sent to your agency email!");
    }, 2000);
  };

  const handleNewCampaign = () => {
    console.log("New Campaign button clicked");
    setShowCampaignModal(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-t-4 border-primary rounded-full animate-spin"></div>
        <p className="text-text-muted font-bold animate-pulse uppercase tracking-[0.2em] text-[10px]">Accessing Workspace...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-text selection:bg-primary/30">
      <Sidebar />
      
      <div className="flex-1 ml-64 min-h-screen relative">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

        <Header />
        
        <main className="p-8 max-w-[1400px] mx-auto animate-fade-in relative z-10">
          {/* Welcome Section */}
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 block">Agency Control Center</span>
              <h1 className="text-5xl font-black tracking-tight text-white">
                Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary bg-300% animate-gradient">{user?.name || 'Partner'}</span>
              </h1>
              <p className="text-text-muted font-medium mt-2">Here&apos;s what&apos;s happening with your agency today.</p>
            </div>
            <div className="flex gap-4 relative z-20">
              <button 
                id="export-btn"
                onClick={handleExport}
                disabled={isExporting}
                className="btn-secondary min-w-[160px] relative z-30"
              >
                {isExporting ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Export Report
                  </>
                )}
              </button>
              <button 
                id="new-campaign-btn"
                onClick={handleNewCampaign}
                className="btn-primary !px-8 shadow-xl shadow-primary/20 relative z-30"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Campaign
              </button>
            </div>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard 
              label="Total Campaigns" 
              value={data?.totalCampaigns || 0} 
              trend="+12%" 
              onClick={() => router.push('/analytics')}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
            />
            <StatCard 
              label="Active Audience" 
              value={data?.activeUsers || 0} 
              trend="+5.4%" 
              onClick={() => router.push('/clients')}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            />
            <StatCard 
              label="Total Revenue" 
              value={`$${(data?.revenue || 0).toLocaleString()}`} 
              trend="+24%" 
              isCurrency
              onClick={() => router.push('/revenue')}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard 
              label="ROI Performance" 
              value={`${data?.performance || 0}%`} 
              trend="+8.1%" 
              onClick={() => router.push('/analytics')}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="card h-[400px] flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/30 transition-all">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform shadow-[0_0_40px_rgba(99,102,241,0.1)]">
                   <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <h3 className="text-2xl font-black mb-2 tracking-tight">Real-time Performance Chart</h3>
                <p className="text-text-muted max-w-sm font-medium">Click to visualize deep insights and historical campaign data.</p>
              </div>

              <div className="card p-0 overflow-hidden">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                   <h3 className="text-xl font-black uppercase tracking-tight">Ongoing Initiatives</h3>
                   <button 
                    onClick={() => router.push('/projects')}
                    className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                   >
                    View Pipeline
                   </button>
                </div>
                <div className="divide-y divide-white/5">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      onClick={() => router.push('/projects')}
                      className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${i === 1 ? 'bg-primary/20 text-primary' : i === 2 ? 'bg-secondary/20 text-secondary' : 'bg-green-500/20 text-green-400'}`}>
                          {i === 1 ? 'NM' : i === 2 ? 'TF' : 'BL'}
                        </div>
                        <div>
                          <h4 className="font-bold text-white group-hover:text-primary transition-colors">{i === 1 ? 'Nike Summer Campaign' : i === 2 ? 'Tesla FSD Launch' : 'BlueBottle Coffee UI'}</h4>
                          <p className="text-[10px] text-text-muted uppercase tracking-widest font-black mt-0.5">Digital Strategy • Q2 2026</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-white">{i === 1 ? '$12,400' : i === 2 ? '$45,000' : '$8,200'}</p>
                        <span className="inline-flex items-center text-[9px] text-green-400 font-black uppercase tracking-widest bg-green-400/10 px-2 py-0.5 rounded-full mt-1">
                          <span className="w-1 h-1 rounded-full bg-green-400 mr-1.5 animate-pulse"></span>
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="card bg-gradient-to-br from-primary/10 to-transparent border-primary/20 p-8">
                <h3 className="text-lg font-black mb-8 uppercase tracking-tight">Campaign Health</h3>
                <div className="space-y-8">
                  <HealthBar label="Social Engagement" value={82} color="bg-primary" />
                  <HealthBar label="Conversion Rate" value={64} color="bg-secondary" />
                  <HealthBar label="Email Open Rate" value={91} color="bg-green-400" />
                </div>
              </div>

              <div className="card p-8">
                <h3 className="text-lg font-black mb-8 uppercase tracking-tight">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <ActionBtn icon="🚀" label="Deploy" onClick={() => triggerToast("Initiating edge deployment...")} />
                  <ActionBtn icon="📊" label="Analyze" onClick={() => router.push('/analytics')} />
                  <ActionBtn icon="👥" label="Invite" onClick={() => triggerToast("Invite link copied to clipboard!")} />
                  <ActionBtn icon="⚙️" label="Config" onClick={() => router.push('/settings')} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {showToast.show && (
        <div className="fixed bottom-10 right-10 z-[100] animate-slide-up">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 backdrop-blur-xl border ${showToast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${showToast.type === 'success' ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
            <p className="text-xs font-black uppercase tracking-widest">{showToast.message}</p>
          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={() => setShowCampaignModal(false)} />
          <div className="glass-panel w-full max-w-lg shadow-2xl relative z-10 animate-scale-in">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase tracking-tight">Create New Campaign</h2>
              <button onClick={() => setShowCampaignModal(false)} className="text-text-muted hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form className="p-8 space-y-6" onSubmit={(e) => { e.preventDefault(); setShowCampaignModal(false); triggerToast("Campaign successfully queued for deployment!"); }}>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Campaign Name</label>
                <input type="text" placeholder="e.g. Summer Blitz 2026" className="input-field" required />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Budget Allocation</label>
                  <input type="text" placeholder="$5,000" className="input-field font-mono" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Channel</label>
                  <select className="input-field appearance-none">
                    <option>Omnichannel</option>
                    <option>Social Only</option>
                    <option>Search Engine</option>
                    <option>Influencer</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full btn-primary py-4 shadow-xl shadow-primary/20">
                Launch Campaign
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, trend, icon, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className="card flex flex-col group hover:scale-[1.02] active:scale-95 cursor-pointer transition-all duration-300 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
        {icon}
      </div>
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <h2 className="text-3xl font-black tracking-tight text-white group-hover:text-primary transition-colors">{value}</h2>
        <span className="text-[10px] font-black text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded uppercase tracking-widest">{trend}</span>
      </div>
      <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-primary transition-all duration-500" />
    </div>
  );
}

function HealthBar({ label, value, color }: any) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
        <span className="text-text-muted">{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
        <div 
          className={`h-full ${color} transition-all duration-1000 shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-full`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/30 transition-all group relative overflow-hidden"
    >
      <span className="text-3xl group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-300 z-10">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted group-hover:text-white transition-colors z-10">{label}</span>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
