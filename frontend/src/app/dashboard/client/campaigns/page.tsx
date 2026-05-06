'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";

export default function ClientCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="client" />
      <div className="flex-1 ml-[260px] flex flex-col">
        <Header />
        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-slate-900">Active Campaigns</h1>
            <p className="text-sm text-slate-500 mt-1">View live status and performance metrics for your agency-managed campaigns.</p>
          </div>

          <div className="card !p-0 overflow-hidden bg-white">
             <div className="p-6 border-b border-border">
                <h3 className="text-base font-bold text-slate-900">Campaign Portfolio</h3>
             </div>
             
             {loading ? (
               <div className="p-12 text-center text-slate-400">Loading performance data...</div>
             ) : campaigns.length > 0 ? (
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                           <th className="px-8 py-4">Campaign</th>
                           <th className="px-8 py-4">Budget</th>
                           <th className="px-8 py-4">Status</th>
                           <th className="px-8 py-4 text-right">Reports</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {campaigns.map((c) => (
                           <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-8 py-5">
                                 <span className="font-semibold text-sm text-slate-900">{c.name}</span>
                              </td>
                              <td className="px-8 py-5 text-sm font-bold text-slate-700">${c.budget.toLocaleString()}</td>
                              <td className="px-8 py-5">
                                 <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter border ${
                                    c.status === 'active' 
                                       ? 'bg-green-50 text-green-700 border-green-100' 
                                       : 'bg-amber-50 text-amber-700 border-amber-100'
                                 }`}>
                                    {c.status}
                                 </span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                 <button className="text-xs font-bold text-indigo-600 hover:underline">Download PDF</button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
             ) : (
               <div className="p-20 text-center">
                  <p className="text-slate-400 text-sm italic">No campaigns are currently active for your account.</p>
               </div>
             )}
          </div>
        </main>
      </div>
    </div>
  );
}
