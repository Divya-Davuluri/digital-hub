'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import apiCall from "@/lib/api";
import RoleGuard from "@/components/RoleGuard";

export default function AdminClientsPage() {
  const router = useRouter();

  const [clients, setClients] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteResult, setShowInviteResult] = useState<any>(null);
  
  const [newClient, setNewClient] = useState({ 
    clientName: '', 
    contactEmail: '', 
    companyName: '',
    plan: 'starter',
    assignedTeamMemberId: '',
    sendInvite: true
  });
  
  const [editingClient, setEditingClient] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clientsData, teamData] = await Promise.all([
        apiCall("/api/agency/clients"),
        apiCall("/api/agency/team-members")
      ]);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setTeamMembers(Array.isArray(teamData) ? teamData : []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await apiCall("/api/agency/clients", {
        method: 'POST',
        body: JSON.stringify({
          name: newClient.clientName,
          email: newClient.contactEmail,
          companyName: newClient.companyName,
          plan: newClient.plan,
          assignedTeamMemberId: newClient.assignedTeamMemberId || null,
          sendInvite: newClient.sendInvite
        }),
      });
      
      setShowAddModal(false);
      setShowInviteResult(result);
      setNewClient({ 
        clientName: '', 
        contactEmail: '', 
        companyName: '', 
        plan: 'starter', 
        assignedTeamMemberId: '', 
        sendInvite: true 
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to add client");
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
      fetchData();
    } catch (err) {
      alert("Failed to update client");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client? This will also remove their user account and workspace.")) return;
    try {
      await apiCall(`/api/agency/clients/${id}`, {
        method: 'DELETE'
      });
      fetchData();
    } catch (err) {
      alert("Failed to delete client");
    }
  };

  const allowedRoles: ('admin' | 'team' | 'client')[] = ['admin'];

  return (
    <RoleGuard allowedRoles={allowedRoles}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="admin" />
        <div className="flex-1 flex flex-col" style={{ marginLeft: '260px' }}>
          <Header />
          <main className="p-8 max-w-7xl mx-auto w-full">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Client Management</h1>
                <p className="text-sm text-slate-500 mt-1">Onboard new clients, assign teams, and manage workspaces.</p>
              </div>
              <button 
                 onClick={() => setShowAddModal(true)}
                 className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg hover:bg-indigo-700 transition-all"
              >
                 + Add New Client
              </button>
            </div>

            {showInviteResult && (
              <div className="mb-8 p-6 bg-green-50 border border-green-100 rounded-2xl relative">
                <button onClick={() => setShowInviteResult(null)} className="absolute top-4 right-4 text-green-600 font-bold text-xl">&times;</button>
                <h3 className="text-green-800 font-bold mb-2">✅ Client Onboarded Successfully!</h3>
                <p className="text-green-700 text-sm mb-4">
                  {showInviteResult.inviteSent 
                    ? "Welcome email has been sent to the client with their login credentials."
                    : "Email provider not configured. Please share the credentials below manually."}
                </p>
                <div className="bg-white p-4 rounded-xl border border-green-200 inline-block">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Temporary Password</p>
                  <code className="text-lg font-black text-slate-900 tracking-wider">{showInviteResult.tempPassword}</code>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-100 bg-white">
                  <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider text-sm">Active Agency Portals</h3>
               </div>
               
               {loading ? (
                 <div className="p-12 text-center text-slate-400 italic animate-pulse">Syncing client directory...</div>
               ) : clients.length > 0 ? (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                          <tr>
                             <th className="px-8 py-4">Client / Company</th>
                             <th className="px-8 py-4">Plan</th>
                             <th className="px-8 py-4">Assigned Team</th>
                             <th className="px-8 py-4">Status</th>
                             <th className="px-8 py-4 text-right">Actions</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 bg-white">
                          {clients.map((client) => (
                             <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-8 py-5">
                                  <div className="font-bold text-sm text-slate-900">{client.name}</div>
                                  <div className="text-xs text-slate-400">{client.company_name || client.email}</div>
                                </td>
                                <td className="px-8 py-5 text-sm text-slate-500">
                                  <span className="font-bold uppercase text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600">{client.plan || 'Starter'}</span>
                                </td>
                                <td className="px-8 py-5 text-sm text-slate-500 font-medium">
                                  {client.team_member_name || <span className="text-slate-300 italic">Unassigned</span>}
                                </td>
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
                                     onClick={() => {
                                       setEditingClient(client);
                                       setShowEditModal(true);
                                     }}
                                     className="text-xs font-bold text-indigo-600 hover:underline"
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
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative z-10 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Onboard New Client</h2>
                  <p className="text-xs text-slate-500">Automated workspace and user creation flow.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
              </div>
              
              <form className="p-8 space-y-6" onSubmit={handleAddClient}>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Client Contact Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe" 
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      required 
                      value={newClient.clientName}
                      onChange={(e) => setNewClient({...newClient, clientName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Contact Email</label>
                    <input 
                      type="email" 
                      placeholder="contact@client.com" 
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      required 
                      value={newClient.contactEmail}
                      onChange={(e) => setNewClient({...newClient, contactEmail: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Company / Brand Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Nike" 
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      required
                      value={newClient.companyName}
                      onChange={(e) => setNewClient({...newClient, companyName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Subscription Plan</label>
                    <select 
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none cursor-pointer"
                      value={newClient.plan}
                      onChange={(e) => setNewClient({...newClient, plan: e.target.value})}
                    >
                      <option value="starter">Starter Plan</option>
                      <option value="pro">Pro Agency Plan</option>
                      <option value="enterprise">Enterprise Plan</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Assign Team Member</label>
                  <select 
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none cursor-pointer"
                    value={newClient.assignedTeamMemberId}
                    onChange={(e) => setNewClient({...newClient, assignedTeamMemberId: e.target.value})}
                  >
                    <option value="">No Member Assigned</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <input 
                    type="checkbox" 
                    id="sendInvite" 
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={newClient.sendInvite}
                    onChange={(e) => setNewClient({...newClient, sendInvite: e.target.checked})}
                  />
                  <label htmlFor="sendInvite" className="text-sm font-bold text-slate-600 cursor-pointer">Send Welcome Email with Credentials</label>
                </div>

                <button type="submit" disabled={submitting} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-xl shadow-indigo-200">
                  {submitting ? 'Creating System Records...' : 'Deploy Client Workspace'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowEditModal(false)} />
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 p-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Manage Client Workspace</h2>
            <form className="space-y-4" onSubmit={handleUpdateClient}>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Client Name</label>
                <input 
                  type="text" 
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Status</label>
                <select 
                  value={editingClient.status || 'active'}
                  onChange={(e) => setEditingClient({...editingClient, status: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-6">
                <button 
                  type="button"
                  onClick={() => handleDeleteClient(editingClient.id)}
                  className="px-6 py-3 border border-red-100 text-red-500 rounded-2xl text-xs font-bold hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                >
                  {submitting ? 'Saving...' : 'Update Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </RoleGuard>
  );
}
