'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import apiCall from "@/lib/api";

export default function AdminClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newClient, setNewClient] = useState({ clientName: '', contactEmail: '', companyName: '' });
  const [editingClient, setEditingClient] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await apiCall("/api/agency/clients");
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setClients([]);
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
    try {
      await apiCall("/api/agency/clients", {
        method: 'POST',
        body: JSON.stringify({
          name: newClient.clientName,
          email: newClient.contactEmail,
          companyName: newClient.companyName
        }),
      });
      setShowAddModal(false);
      setNewClient({ clientName: '', contactEmail: '', companyName: '' });
      fetchClients();
    } catch (err) {
      alert("Failed to add client");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiCall(`/api/agency/clients/${editingClient.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editingClient.name,
          email: editingClient.email,
          status: editingClient.status
        }),
      });
      setShowEditModal(false);
      setEditingClient(null);
      fetchClients();
    } catch (err) {
      alert("Failed to update client");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client? This will also remove their user account.")) return;
    try {
      await apiCall(`/api/agency/clients/${id}`, {
        method: 'DELETE'
      });
      fetchClients();
    } catch (err) {
      alert("Failed to delete client");
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#f9fafb', minHeight: '100vh' }}>
      <Sidebar role="admin" />
      <div className="flex-1 ml-[260px] flex flex-col">
        <Header />
        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Client Management</h1>
              <p className="text-sm text-slate-500 mt-1">Add, edit, and manage all client workspaces from this central console.</p>
            </div>
            <button 
               onClick={() => setShowAddModal(true)}
               className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors"
            >
               + Add New Client
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-100 bg-white">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider text-sm">All Agency Clients</h3>
             </div>
             
             {loading ? (
               <div className="p-12 text-center text-slate-400 italic animate-pulse">Loading Client Directory...</div>
             ) : clients.length > 0 ? (
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                           <th className="px-8 py-4">Client</th>
                           <th className="px-8 py-4">Email Address</th>
                           <th className="px-8 py-4">Company</th>
                           <th className="px-8 py-4">Status</th>
                           <th className="px-8 py-4 text-right">Settings</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 bg-white">
                        {clients.map((client) => (
                           <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-8 py-5 font-semibold text-sm text-slate-900">{client.name}</td>
                              <td className="px-8 py-5 text-sm text-slate-500">{client.email}</td>
                              <td className="px-8 py-5 text-sm text-slate-500">{client.company_name || '-'}</td>
                              <td className="px-8 py-5">
                                 <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-tighter ${
                                   (client.status || 'Active').toLowerCase() === 'active' 
                                   ? 'bg-green-50 text-green-700 border-green-100' 
                                   : 'bg-amber-50 text-amber-700 border-amber-100'
                                 }`}>
                                    {client.status || 'Active'}
                                 </span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                 <button 
                                  onClick={() => router.push(`/dashboard/admin/clients/${client.id}/settings`)}
                                  className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors px-3 py-1 border border-slate-200 rounded-md hover:border-indigo-200 hover:bg-indigo-50"
                                 >
                                  Edit Settings
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
             ) : (
               <div className="p-20 text-center bg-white">
                  <div className="text-4xl mb-4 opacity-50">🏢</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No Clients Found</h3>
                  <p className="text-sm text-slate-500 mb-6">Start by adding your first agency client workspace.</p>
                  <button onClick={() => setShowAddModal(true)} className="text-sm font-bold text-indigo-600 hover:underline">Add First Client →</button>
               </div>
             )}
          </div>
        </main>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 p-6 space-y-6 animate-subtle-fade">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 -mx-6 px-6">
              <h2 className="text-lg font-bold text-slate-900">Add New Client</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl line-height-1">&times;</button>
            </div>
            <form className="space-y-4" onSubmit={handleAddClient}>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Client Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Nike Marketing" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required 
                  value={newClient.clientName}
                  onChange={(e) => setNewClient({...newClient, clientName: e.target.value})}
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
              <button type="submit" disabled={submitting} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-4 shadow-lg shadow-indigo-100">
                {submitting ? 'Creating...' : 'Create Client Workspace'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 p-6 space-y-6 animate-subtle-fade">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 -mx-6 px-6">
              <h2 className="text-lg font-bold text-slate-900">Edit Client Settings</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl line-height-1">&times;</button>
            </div>
            <form className="space-y-4" onSubmit={handleUpdateClient}>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Client Name</label>
                <input 
                  type="text" 
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Contact Email</label>
                <input 
                  type="email" 
                  value={editingClient.email}
                  onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Status</label>
                <select 
                  value={editingClient.status || 'ACTIVE'}
                  onChange={(e) => setEditingClient({...editingClient, status: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => handleDeleteClient(editingClient.id)}
                  className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-100"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
