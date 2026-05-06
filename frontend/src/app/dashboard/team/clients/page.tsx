'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";

export default function TeamClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      const data = await apiFetch("/agency/clients");
      setClients(data);
    } catch (err) {
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
    
    console.log('[CLIENT_ADD] Sending payload:', newClient);

    try {
      await apiFetch("/agency/clients", {
        method: 'POST',
        body: JSON.stringify(newClient),
      });
      setShowModal(false);
      setNewClient({ name: '', email: '' });
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
              className="btn-primary !py-2.5 !px-6 text-xs font-bold shadow-lg shadow-indigo-100"
            >
               + Add New Client
            </button>
          </div>

          <div className="card !p-0 overflow-hidden">
             <div className="p-6 border-b border-border flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
                      {clients.length}
                   </div>
                   <h3 className="text-base font-bold text-slate-900">Portfolio Overview</h3>
                </div>
             </div>
             
             {loading ? (
               <div className="p-12 text-center text-slate-400">Loading your clients...</div>
             ) : clients.length > 0 ? (
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                           <th className="px-8 py-4">Client Name</th>
                           <th className="px-8 py-4">Email</th>
                           <th className="px-8 py-4">Status</th>
                           <th className="px-8 py-4 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 bg-white">
                        {clients.map((client) => (
                           <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-8 py-5 font-semibold text-sm text-slate-900">{client.name}</td>
                              <td className="px-8 py-5 text-sm text-slate-500">{client.email}</td>
                              <td className="px-8 py-5">
                                 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 uppercase tracking-tighter">
                                    {client.status || 'Active'}
                                 </span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                 <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Manage</button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
             ) : (
               <div className="p-20 text-center bg-white">
                  <div className="text-4xl mb-4">👥</div>
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
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 animate-subtle-fade overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Add New Client</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <form className="p-6 space-y-4" onSubmit={handleAddClient}>
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl animate-shake">
                   ⚠️ {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Nike Marketing" 
                  className="input-field" 
                  required 
                  value={newClient.name}
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Email</label>
                <input 
                  type="email" 
                  placeholder="contact@client.com" 
                  className="input-field" 
                  required 
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                />
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full btn-primary py-3 mt-4 text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
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
