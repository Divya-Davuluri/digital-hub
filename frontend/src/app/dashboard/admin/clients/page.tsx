"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import apiCall from "@/lib/api";
import RoleGuard from "@/components/RoleGuard";

export default function AdminClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteResult, setShowInviteResult] = useState<any>(null);
  
  const [newClient, setNewClient] = useState({ 
    clientName: "", 
    contactEmail: "", 
    companyName: "",
    plan: "starter",
    assignedTeamMemberId: "",
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
        method: "POST",
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
      setNewClient({ clientName: "", contactEmail: "", companyName: "", plan: "starter", assignedTeamMemberId: "", sendInvite: true });
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
        method: "PATCH",
        body: JSON.stringify({
          name: editingClient.name,
          email: editingClient.email,
          status: editingClient.status,
          assignedTeamMemberId: editingClient.assignedTeamMemberId || null
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
    if (!confirm("Are you sure?")) return;
    try {
      await apiCall(`/api/agency/clients/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="admin" />
        <div className="flex-1 flex flex-col" style={{ marginLeft: "260px" }}>
          <Header />
          <main className="p-8 max-w-7xl mx-auto w-full">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Client Management</h1>
                <p className="text-sm text-slate-500 mt-1">Manage agency client workspaces.</p>
              </div>
              <button onClick={() => setShowAddModal(true)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg hover:bg-indigo-700 transition-all">+ Add New Client</button>
            </div>

            {showInviteResult && (
              <div className="mb-8 p-6 bg-green-50 border border-green-100 rounded-2xl relative">
                <button onClick={() => setShowInviteResult(null)} className="absolute top-4 right-4 text-green-600 font-bold text-xl">X</button>
                <h3 className="text-green-800 font-bold mb-2">Workspace Deployed!</h3>
                <p className="text-green-700 text-sm mb-4">{showInviteResult.inviteSent ? "Email sent." : "Share manually:"}</p>
                <div className="bg-white p-4 rounded-xl border border-green-200 inline-block">
                  <code className="text-lg font-black text-slate-900 tracking-wider">{showInviteResult.tempPassword}</code>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Agency Clients</h3>
               </div>
               
               {loading ? <div className="p-12 text-center text-slate-400 italic animate-pulse">Syncing...</div> : (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                          <tr>
                             <th className="px-8 py-4">Client</th>
                             <th className="px-8 py-4">Plan</th>
                             <th className="px-8 py-4">Team</th>
                             <th className="px-8 py-4">Status</th>
                             <th className="px-8 py-4 text-right">Actions</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 bg-white">
                          {clients.length > 0 ? (
                            clients.map((client) => (
                               <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-8 py-5">
                                    <div className="font-bold text-sm text-slate-900">{client.name}</div>
                                    <div className="text-xs text-slate-400">{client.email}</div>
                                  </td>
                                  <td className="px-8 py-5 text-sm text-slate-500 font-bold uppercase text-[10px]">{client.plan || "Starter"}</td>
                                  <td className="px-8 py-5 text-sm text-slate-500">{client.team_member_name || "Unassigned"}</td>
                                  <td className="px-8 py-5">
                                     <span className="px-2 py-1 rounded bg-green-50 text-green-700 text-[10px] font-bold uppercase border border-green-100">{client.status || "Active"}</span>
                                  </td>
                                  <td className="px-8 py-5 text-right">
                                      <button onClick={() => { setEditingClient(client); setShowEditModal(true); }} className="text-xs font-bold text-indigo-600 hover:underline">Edit</button>
                                  </td>
                               </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-6 py-16 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 text-2xl">
                                  🏢
                                </div>
                                <h4 className="text-base font-bold text-slate-900 mb-1">No Clients Yet</h4>
                                <p className="text-sm text-slate-500 max-w-[300px] mx-auto">
                                  Your agency has no active clients. Click "Add New Client" to onboard your first workspace.
                                </p>
                              </td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
               )}
            </div>
          </main>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative z-10 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Add New Client</h2>
                  <p className="text-xs text-slate-500">Automated workspace flow.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">X</button>
              </div>
              <form className="p-8 space-y-6" onSubmit={handleAddClient}>
                <div className="grid grid-cols-2 gap-6">
                  <input type="text" placeholder="Contact Name" className="w-full px-5 py-3 bg-slate-50 border rounded-2xl" required value={newClient.clientName} onChange={(e) => setNewClient({...newClient, clientName: e.target.value})} />
                  <input type="email" placeholder="Email" className="w-full px-5 py-3 bg-slate-50 border rounded-2xl" required value={newClient.contactEmail} onChange={(e) => setNewClient({...newClient, contactEmail: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <input type="text" placeholder="Company Name" className="w-full px-5 py-3 bg-slate-50 border rounded-2xl" required value={newClient.companyName} onChange={(e) => setNewClient({...newClient, companyName: e.target.value})} />
                  <select className="w-full px-5 py-3 bg-slate-50 border rounded-2xl" value={newClient.plan} onChange={(e) => setNewClient({...newClient, plan: e.target.value})} >
                    <option value="starter">Starter Plan</option>
                    <option value="pro">Pro Plan</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <select className="w-full px-5 py-3 bg-slate-50 border rounded-2xl" value={newClient.assignedTeamMemberId} onChange={(e) => setNewClient({...newClient, assignedTeamMemberId: e.target.value})} >
                  <option value="">No Member Assigned</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
                <button type="submit" disabled={submitting} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase shadow-xl shadow-indigo-200">
                  {submitting ? "Creating..." : "Deploy Workspace"}
                </button>
              </form>
            </div>
          </div>
        )}

        {showEditModal && editingClient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowEditModal(false)} />
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 p-8 space-y-6">
              <h2 className="text-xl font-bold text-slate-900">Edit Settings</h2>
              <form className="space-y-4" onSubmit={handleUpdateClient}>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-1">Contact Name</label>
                  <input type="text" value={editingClient.name} onChange={(e) => setEditingClient({...editingClient, name: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border rounded-2xl" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-1">Status</label>
                  <select className="w-full px-5 py-3 bg-slate-50 border rounded-2xl" value={editingClient.status || "active"} onChange={(e) => setEditingClient({...editingClient, status: e.target.value})} >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-1">Assigned Team Member</label>
                  <select className="w-full px-5 py-3 bg-slate-50 border rounded-2xl" value={editingClient.assignedTeamMemberId || ""} onChange={(e) => setEditingClient({...editingClient, assignedTeamMemberId: e.target.value})} >
                    <option value="">No Member Assigned</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" disabled={submitting} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold mt-4 shadow-lg shadow-indigo-100">{submitting ? "Saving..." : "Update"}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
