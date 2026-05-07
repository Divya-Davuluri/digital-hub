'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import apiCall from "@/lib/api";

export default function TeamClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newClient, setNewClient] = useState({ contactPerson: '', contactEmail: '', companyName: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      const data = await apiCall("/api/team/clients");
      setClients(data.clients || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      const data = await apiCall("/api/team/clients", {
        method: 'POST',
        body: JSON.stringify(newClient),
      });

      if (!data.success) {
        throw new Error(data.error || 'Failed to add client');
      }

      setShowModal(false);
      setNewClient({ contactPerson: '', contactEmail: '', companyName: '' });
      fetchClients();
    } catch (err: any) {
      console.error('[CLIENT_ADD_ERROR]', err);
      setError(err.message || 'An unexpected error occurred while adding the client.');
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
              <h1 className="text-2xl font-bold text-slate-900">Assigned Clients</h1>
              <p className="text-sm text-slate-500 mt-1">Manage and monitor marketing performance for your assigned accounts.</p>
            </div>
            <button 
              onClick={() => { setError(null); setShowModal(true); }}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors"
            >
               + Add New Client
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
                      {clients.length}
                   </div>
                   <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider text-sm">Portfolio Overview</h3>
                </div>
             </div>
             
             {loading ? (
               <div className="p-12 text-center text-slate-400 italic animate-pulse">Loading your clients...</div>
             ) : clients.length > 0 ? (
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                           <th className="px-8 py-4">Client Name</th>
                           <th className="px-8 py-4">Email</th>
                           <th className="px-8 py-4">Company</th>
                           <th className="px-8 py-4">Status</th>
                           <th className="px-8 py-4 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 bg-white">
                        {clients.map((client) => (
                           <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-8 py-5 font-semibold text-sm text-slate-900">{client.name}</td>
                              <td className="px-8 py-5 text-sm text-slate-500">{client.email}</td>
                              <td className="px-8 py-5 text-sm text-slate-500">{client.company_name || '-'}</td>
                              <td className="px-8 py-5">
                                 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 uppercase tracking-tighter">
                                    {client.status || 'Active'}
                                 </span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                 <button className="text-xs font-bold text-indigo-600 hover:underline">Manage</button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
             ) : (
               <div className="p-20 text-center bg-white">
                  <div className="text-4xl mb-4 opacity-50">👥</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No Assigned Clients</h3>
                  <p className="text-sm text-slate-500">You haven&apos;t been assigned any clients yet.</p>
                  <button onClick={() => setShowModal(true)} className="text-sm font-bold text-indigo-600 hover:underline mt-4">Add Your First Client →</button>
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
              <h2 className="text-lg font-bold text-slate-900">Add New Client</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl line-height-1">&times;</button>
            </div>
            <form className="space-y-4" onSubmit={handleAddClient}>
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100">
                   ⚠️ {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Client Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Nike Marketing" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required 
                  value={newClient.contactPerson}
                  onChange={(e) => setNewClient({...newClient, contactPerson: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Contact Email</label>
                <input 
                  type="email" 
                  placeholder="contact@client.com" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required 
                  value={newClient.contactEmail}
                  onChange={(e) => setNewClient({...newClient, contactEmail: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Company Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Nike" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={newClient.companyName}
                  onChange={(e) => setNewClient({...newClient, companyName: e.target.value})}
                />
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-4 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding...
                  </>
                ) : "Create Client Workspace"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
