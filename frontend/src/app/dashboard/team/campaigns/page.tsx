'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";

export default function TeamCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', budget: '', clientId: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [campaignData, clientData] = await Promise.all([
        apiFetch("/agency/campaigns"),
        apiFetch("/agency/clients")
      ]);
      setCampaigns(campaignData);
      setClients(clientData);
    } catch (err) {
      console.error(err);
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
      await apiFetch("/agency/campaigns", {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          budget: Number(formData.budget)
        })
      });
      setShowModal(false);
      setFormData({ name: '', budget: '', clientId: '' });
      fetchData();
    } catch (err) {
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
              className="btn-primary !py-2.5 !px-6 text-xs font-bold shadow-lg shadow-indigo-100"
            >
               + Create New Campaign
            </button>
          </div>

          <div className="card !p-0 overflow-hidden">
             <div className="p-6 border-b border-border bg-white flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900">Active Campaign Portfolio</h3>
                <div className="flex gap-2">
                   <select className="text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors">
                      <option>All Statuses</option>
                      <option>Active</option>
                      <option>Paused</option>
                   </select>
                </div>
             </div>
             
             {loading ? (
               <div className="p-12 text-center text-slate-400 italic">Syncing with ad networks...</div>
             ) : campaigns.length > 0 ? (
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                           <th className="px-8 py-4">Campaign Name</th>
                           <th className="px-8 py-4">Budget</th>
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
                              <td className="px-8 py-5 font-bold text-sm text-slate-700">${c.budget.toLocaleString()}</td>
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
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 animate-subtle-fade">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Launch New Campaign</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <form className="p-6 space-y-4" onSubmit={handleCreate}>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campaign Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Q4 Growth Drive" 
                  className="input-field" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Budget ($)</label>
                <input 
                  type="number" 
                  placeholder="5000" 
                  className="input-field" 
                  required 
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assign to Client</label>
                <select 
                  className="input-field" 
                  required 
                  value={formData.clientId}
                  onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                >
                  <option value="">Select a Client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full btn-primary py-3 mt-4 text-sm font-bold disabled:opacity-50"
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
