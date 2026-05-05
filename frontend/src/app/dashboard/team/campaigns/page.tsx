'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";

export default function TeamCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/team/campaigns");
      console.log('Campaigns response:', data);
      setCampaigns(data.campaigns || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
         <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
         <p className="text-slate-500 text-sm font-medium">Loading sync data...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="team" />
      <div className="flex-1 ml-[260px] flex flex-col">
        <Header />
        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Campaign Management</h1>
              <p className="text-sm text-slate-500 mt-1">Monitor performance and budget for all your assigned client campaigns.</p>
            </div>
            <button 
              onClick={() => fetchCampaigns()}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              ↻ Refresh Data
            </button>
          </div>

          <div className="card !p-0 overflow-hidden bg-white shadow-sm border border-slate-200 rounded-2xl">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                      <tr>
                         <th className="px-8 py-4">Campaign Name</th>
                         <th className="px-8 py-4">Client</th>
                         <th className="px-8 py-4">Status</th>
                         <th className="px-8 py-4">Budget</th>
                         <th className="px-8 py-4 text-right">Performance</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {campaigns.length > 0 ? campaigns.map((campaign: any) => (
                        <tr key={campaign.id} className="hover:bg-slate-50 transition-colors group">
                           <td className="px-8 py-5">
                              <span className="font-semibold text-sm text-slate-900">{campaign.name}</span>
                           </td>
                           <td className="px-8 py-5 text-sm text-slate-600">
                              {campaign.clientName || 'N/A'}
                           </td>
                           <td className="px-8 py-5">
                              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight" style={{
                                background: 
                                  campaign.status?.toUpperCase() === 'ACTIVE' ? '#d1fae5' 
                                  : campaign.status?.toUpperCase() === 'PAUSED' ? '#fef3c7'
                                  : campaign.status?.toUpperCase() === 'COMPLETED' ? '#f3f4f6'
                                  : '#dbeafe',
                                color:
                                  campaign.status?.toUpperCase() === 'ACTIVE' ? '#065f46'
                                  : campaign.status?.toUpperCase() === 'PAUSED' ? '#92400e'
                                  : campaign.status?.toUpperCase() === 'COMPLETED' ? '#6b7280'
                                  : '#1e40af'
                              }}>
                                 {campaign.status || 'DRAFT'}
                              </span>
                           </td>
                           <td className="px-8 py-5 font-bold text-sm text-slate-900">
                              ${(campaign.budget || 0).toLocaleString()}
                           </td>
                           <td className="px-8 py-5 text-right">
                              <div className="flex flex-col items-end">
                                 <span className="text-xs font-bold text-slate-900">
                                   {campaign.clicks && campaign.impressions
                                     ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) + '%'
                                     : '0.00%'
                                   } CTR
                                 </span>
                                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                                   {campaign.conversions || 0} conversions
                                 </span>
                              </div>
                           </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center">
                            <div className="text-4xl mb-4">🚀</div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">No Campaigns Found</h3>
                            <p className="text-sm text-slate-500">Your assigned clients don&apos;t have any campaigns yet.</p>
                          </td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}
