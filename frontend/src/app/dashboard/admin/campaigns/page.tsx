'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";
import { getCampaigns, updateCampaignStatus, Campaign } from "@/services/campaignService";

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllCampaigns = async () => {
      try {
        const data = await getCampaigns();
        setCampaigns(data);
      } catch (err) {
        console.error("Error fetching campaigns:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllCampaigns();
  }, []);

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await updateCampaignStatus(id, newStatus);
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as any } : c));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="admin" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8">
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Global Campaigns</h1>
                <p className="text-slate-500">Monitor all client advertising activity across platforms.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Campaign</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Platform</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Budget</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Performance</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">Loading campaign data...</td>
                    </tr>
                  ) : campaigns.length > 0 ? (
                    campaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.clientName || 'General'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            c.channel === 'google' ? 'bg-red-50 text-red-600' :
                            c.channel === 'facebook' ? 'bg-blue-50 text-blue-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {c.channel}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-900">${c.budget.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400 font-medium">Monthly Cap</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-4">
                            <div>
                              <div className="text-xs font-bold text-slate-900">{c.conversions}</div>
                              <div className="text-[10px] text-slate-400">Conv.</div>
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{(c.spend / (c.clicks || 1)).toFixed(2)}</div>
                              <div className="text-[10px] text-slate-400">CPC</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            c.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`} />
                            {c.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleStatusToggle(c.id, c.status)}
                            className="text-xs font-bold text-primary hover:opacity-80 uppercase tracking-wider"
                          >
                            {c.status === 'active' ? 'Pause' : 'Resume'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 text-2xl">
                          🚀
                        </div>
                        <h4 className="text-base font-bold text-slate-900 mb-1">No Active Campaigns</h4>
                        <p className="text-sm text-slate-500 max-w-[300px] mx-auto">
                          Global campaign data will appear here once clients or team members launch new initiatives.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
