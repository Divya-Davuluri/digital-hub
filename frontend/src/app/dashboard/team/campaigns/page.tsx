'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";
import { getCampaigns, Campaign } from "@/services/campaignService";
import { useAuth } from "@/context/AuthContext";

export default function TeamCampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamCampaigns = async () => {
      try {
        // Team sees campaigns for their assigned workspace
        const data = await getCampaigns(user?.workspaceId || undefined);
        setCampaigns(data);
      } catch (err) {
        console.error("Error fetching campaigns:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchTeamCampaigns();
  }, [user]);

  return (
    <RoleGuard allowedRoles={['team', 'admin']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="team" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8">
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Active Campaigns</h1>
                <p className="text-slate-500">Managing performance for assigned client accounts.</p>
              </div>
              <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors">
                + Create Campaign
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full py-12 text-center text-slate-400 italic">Syncing active campaigns...</div>
              ) : campaigns.length > 0 ? (
                campaigns.map((c) => (
                  <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        c.channel === 'google' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {c.channel}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${c.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">{c.name}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">{c.clientName || 'Standard Account'}</p>
                    
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spend</p>
                        <p className="font-bold text-slate-900">${c.spend.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budget</p>
                        <p className="font-bold text-indigo-600">${c.budget.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex gap-2">
                       <button className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition-colors">Details</button>
                       <button className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-xs font-bold text-white transition-colors">Edit</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400">No campaigns assigned to your workspace yet.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
