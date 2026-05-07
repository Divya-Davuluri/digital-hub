'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import apiCall from "@/lib/api";

export default function TeamCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', budget: '', clientName: '', platform: 'Meta' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [campaignData, clientData] = await Promise.all([
        apiCall("/api/team/campaigns"),
        apiCall("/api/team/clients")
      ]);
      setCampaigns(campaignData.campaigns || []);
      setClients(clientData.clients || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiCall("/api/team/campaigns", {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          budget: Number(formData.budget)
        })
      });
      setShowModal(false);
      setFormData({ name: '', budget: '', clientName: '', platform: 'Meta' });
      fetchData();
    } catch (err) {
      console.error('Create error:', err);
      alert("Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="team" />
      <div className="flex-1 ml-[260px] flex flex-col">
        <Header />
        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Campaign Management</h1>
              <p className="text-sm text-slate-500 mt-1">Monitor, pause, and optimize active marketing campaigns across all platforms.</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors"
            >
               + Create New Campaign
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider text-sm">Active Campaign Portfolio</h3>
             </div>
             
             {loading ? (
               <div className="p-12 text-center text-slate-400 italic animate-pulse">Syncing with ad networks...</div>
             ) : campaigns.length > 0 ? (
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                           <th className="px-8 py-4">Campaign Name</th>
                           <th className="px-8 py-4">Budget</th>
                           <th className="px-8 py-4">Platform</th>
                           <th className="px-8 py-4">Status</th>
                           <th className="px-8 py-4 text-right">Performance</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 bg-white">
                        {campaigns.map((c) => (
                           <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-8 py-5">
                                 <div className="flex flex-col">
                                    <span className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">{c.name}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">ID: {c.id.split('-')[0]}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-5 font-bold text-sm text-slate-700">${Number(c.budget || 0).toLocaleString()}</td>
                              <td className="px-8 py-5 text-xs text-slate-500 font-medium">{c.platform || 'Meta'}</td>
                              <td className="px-8 py-5">
                                 <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter border ${
                                    c.status === 'ACTIVE' 
                                       ? 'bg-green-50 text-green-700 border-green-100' 
                                       : 'bg-amber-50 text-amber-700 border-amber-100'
                                 }`}>
                                    {c.status || 'ACTIVE'}
                                 </span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                 <button className="text-xs font-bold text-indigo-600 hover:underline">View Analytics</button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
             ) : (
               <div className="p-20 text-center bg-white">
                  <div className="text-4xl mb-4">🚀</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No Active Campaigns</h3>
                  <p className="text-sm text-slate-500">You haven&apos;t launched any campaigns yet. Start by creating one!</p>
                  <button onClick={() => setShowModal(true)} className="text-sm font-bold text-indigo-600 hover:underline mt-4">Create First Campaign →</button>
               </div>
             )}
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 -mx-6 px-6">
              <h2 className="text-lg font-bold text-slate-900">Launch New Campaign</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Campaign Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Q4 Growth Drive" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Total Budget ($)</label>
                <input 
                  type="number" 
                  placeholder="5000" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required 
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Client Name</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none"
                  required 
                  value={formData.clientName}
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                >
                  <option value="">Select a Client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.name}>{client.name}</option>
                  ))}
                  <option value="General">General</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Platform</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none"
                  required 
                  value={formData.platform}
                  onChange={(e) => setFormData({...formData, platform: e.target.value})}
                >
                  <option value="Meta">Meta Ads</option>
                  <option value="Google">Google Ads</option>
                  <option value="LinkedIn">LinkedIn Ads</option>
                  <option value="TikTok">TikTok Ads</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-4 shadow-lg shadow-indigo-100"
              >
                {submitting ? "Launching..." : "Deploy Campaign"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
