'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";

export default function ClientDashboard() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const data = await apiFetch("/agency/campaigns");
        setCampaigns(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const token = localStorage.getItem('token');
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://digital-hub-3h88.onrender.com';
      const base = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
      
      const response = await fetch(
        `${base}/client/report/pdf`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `campaign-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('PDF download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const totals = campaigns.reduce((acc, c) => ({
    spend: acc.spend + (Number(c.spend) || Number(c.budget) * 0.8 || 0),
    impressions: acc.impressions + (Number(c.impressions) || 0),
    clicks: acc.clicks + (Number(c.clicks) || 0),
    conversions: acc.conversions + (Number(c.conversions) || 0)
  }), { spend: 0, impressions: 0, clicks: 0, conversions: 0 });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617]">
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#020617] text-white selection:bg-emerald-500/30">
      <Sidebar role="client" />
      
      <div className="flex-1 ml-[280px] min-h-screen bg-grid relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <Header />
        
        <main className="p-10 max-w-[1600px] mx-auto relative z-10 animate-fade-in">
          <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">Client Portal</span>
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Performance Center</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white italic">
                Campaign <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Intelligence</span>
              </h1>
              <p className="text-slate-400 font-medium max-w-xl text-lg">View live performance metrics and download your official agency reports.</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="btn-primary !bg-emerald-500 hover:!bg-emerald-400 !px-8 !py-3 flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/50"
              >
                <span className="uppercase text-xs tracking-widest font-black text-white">{downloading ? 'Generating PDF...' : 'Download Report'}</span>
                {!downloading && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <StatCard label="Total Spend" value={`$${totals.spend.toLocaleString()}`} icon="💸" delay="0s" color="emerald" />
            <StatCard label="Impressions" value={formatNumber(totals.impressions)} icon="👀" delay="0.1s" color="blue" />
            <StatCard label="Clicks" value={formatNumber(totals.clicks)} icon="🖱️" delay="0.2s" color="amber" />
            <StatCard label="Conversions" value={formatNumber(totals.conversions)} icon="🎯" delay="0.3s" color="rose" />
          </div>

          <div className="card p-10 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
             </div>
             
             <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Active Campaigns</h3>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Sync</span>
                </div>
             </div>

             {campaigns.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                  {campaigns.map((c, i) => (
                    <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all duration-300 group/camp">
                       <div className="flex justify-between items-start mb-6">
                          <div>
                             <p className="font-black text-lg text-white group-hover/camp:text-emerald-400 transition-colors">{c.name}</p>
                             <div className="flex items-center gap-2 mt-2">
                               <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                 {c.status}
                               </span>
                               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{c.platform || 'Multi-Channel'}</span>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Allocated Budget</p>
                             <p className="text-xl font-black italic text-white">${Number(c.budget).toLocaleString()}</p>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                          <div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Spent</p>
                            <p className="text-sm font-black text-white">${Number(c.spent || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Clicks</p>
                            <p className="text-sm font-black text-white">{formatNumber(Number(c.clicks || 0))}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Conversions</p>
                            <p className="text-sm font-black text-emerald-400">{formatNumber(Number(c.conversions || 0))}</p>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
             ) : (
                <div className="py-20 text-center relative z-10">
                   <div className="text-4xl mb-4 opacity-50">📊</div>
                   <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">No active campaigns</p>
                   <p className="text-[10px] text-slate-500 uppercase tracking-widest">Campaign data will appear here once launched.</p>
                </div>
             )}
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, delay, color }: any) {
  const colorMap: any = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[0_0_30px_rgba(243,113,113,0.1)]',
  };

  const glowMap: any = {
    emerald: 'via-emerald-500/20',
    blue: 'via-blue-500/20',
    amber: 'via-amber-500/20',
    rose: 'via-rose-500/20',
  };

  return (
    <div 
      className={`card p-8 relative overflow-hidden group hover:-translate-y-2 transition-all duration-500`}
      style={{ animationDelay: delay }}
    >
      <div className="absolute top-0 right-0 p-6 text-3xl opacity-20 group-hover:opacity-40 group-hover:scale-125 transition-all duration-500">{icon}</div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">{label}</p>
      <div className="flex items-end justify-between relative z-10">
        <h2 className="text-4xl font-black tracking-tighter text-white italic">{value}</h2>
      </div>
      <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${glowMap[color]} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
    </div>
  );
}
