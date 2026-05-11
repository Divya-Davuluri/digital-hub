'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";
import { getCampaigns, Campaign } from "@/services/campaignService";
import { useAuth } from "@/context/AuthContext";

export default function ClientCampaignStatusPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizingId, setOptimizingId] = useState<string | null>(null);

  const handleOptimize = async (campaignId: string) => {
    setOptimizingId(campaignId);
    // Simulate API call for optimization request
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert("Optimization request submitted successfully! Our AI engine is analyzing your campaign.");
    setOptimizingId(null);
  };

  useEffect(() => {
    const fetchMyCampaigns = async () => {
      try {
        const data = await getCampaigns(user?.workspaceId || undefined);
        setCampaigns(data);
      } catch (err) {
        console.error("Error fetching campaigns:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchMyCampaigns();
  }, [user]);

  return (
    <RoleGuard allowedRoles={['client', 'admin']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="client" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8">
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-slate-900">Campaign Status</h1>
              <p className="text-slate-500">Live performance tracking for your active marketing efforts.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
               {loading ? (
                 <div className="text-center py-12 text-slate-400 italic">Connecting to ad servers...</div>
               ) : campaigns.length > 0 ? (
                 campaigns.map((c) => (
                   <div key={c.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
                      <div className="p-8 flex-1">
                         <div className="flex items-center gap-3 mb-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              c.channel === 'google' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                            }`}>{c.channel}</span>
                            <span className={`w-2 h-2 rounded-full ${c.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{c.status}</span>
                         </div>
                         <h2 className="text-2xl font-bold text-slate-900 mb-2">{c.name}</h2>
                         <div className="flex gap-8 mt-6">
                            <div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Impressions</p>
                               <p className="text-lg font-bold text-slate-900">{c.impressions.toLocaleString()}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Clicks</p>
                               <p className="text-lg font-bold text-slate-900">{c.clicks.toLocaleString()}</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CTR</p>
                               <p className="text-lg font-bold text-slate-900">{((c.clicks / (c.impressions || 1)) * 100).toFixed(2)}%</p>
                            </div>
                         </div>
                      </div>
                      <div className="bg-slate-900 p-8 md:w-80 flex flex-col justify-center text-white">
                         <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Budget Utilization</p>
                         <div className="flex justify-between items-end mb-2">
                            <span className="text-2xl font-bold">${c.spend.toLocaleString()}</span>
                            <span className="text-xs text-white/60 mb-1">of ${c.budget.toLocaleString()}</span>
                         </div>
                         <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full" 
                              style={{ width: `${Math.min((c.spend / c.budget) * 100, 100)}%` }}
                            ></div>
                         </div>
                         <button 
                            onClick={() => handleOptimize(c.id)}
                            disabled={optimizingId === c.id}
                            className="mt-8 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/10 disabled:opacity-50"
                         >
                            {optimizingId === c.id ? 'Requesting...' : 'Request Optimization'}
                         </button>
                      </div>
                   </div>
                 ))
                ) : (
                  <div className="text-center py-24 bg-white rounded-[2rem] border border-dashed border-slate-200 shadow-sm">
                     <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                        📡
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Campaigns</h3>
                     <p className="text-slate-500 max-w-sm mx-auto">
                        Your marketing initiatives are currently being prepared. Check back shortly for live performance tracking.
                     </p>
                  </div>
                )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
