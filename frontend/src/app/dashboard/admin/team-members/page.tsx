"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import apiCall from "@/lib/api";
import RoleGuard from "@/components/RoleGuard";

interface AssignedItem {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  assignedClients: AssignedItem[];
  assignedProjects: AssignedItem[];
  createdAt?: string;
}

export default function AdminTeamMembersPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    password: "",
    role: "TEAM_MEMBER",
    assignedClients: [] as string[],
    assignedProjects: [] as string[],
    status: "active",
  });

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersRes, clientsRes, projectsRes] = await Promise.all([
        apiCall("/api/admin/team-members"),
        apiCall("/api/agency/clients"),
        apiCall("/api/seo/projects").catch(() => ({ data: [] }))
      ]);

      setTeamMembers(membersRes.teamMembers || []);
      setClients(Array.isArray(clientsRes) ? clientsRes : []);
      setProjects(projectsRes.data || []);
    } catch (err: any) {
      console.error("Fetch team members error:", err);
      showToast("error", err.message || "Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email || !newMember.password) {
      return showToast("error", "Name, email, and password are required");
    }

    setSubmitting(true);
    try {
      await apiCall("/api/admin/team-members", {
        method: "POST",
        body: JSON.stringify(newMember),
      });

      showToast("success", "Team member created successfully!");
      setShowAddModal(false);
      setNewMember({
        name: "",
        email: "",
        password: "",
        role: "TEAM_MEMBER",
        assignedClients: [],
        assignedProjects: [],
        status: "active",
      });
      fetchData();
    } catch (err: any) {
      showToast("error", err.message || "Failed to add team member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiCall(`/api/admin/team-members/${editingMember.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editingMember.name,
          email: editingMember.email,
          password: editingMember.password || undefined,
          status: editingMember.status,
          assignedClients: editingMember.assignedClients,
          assignedProjects: editingMember.assignedProjects,
        }),
      });

      showToast("success", "Team member updated successfully!");
      setShowEditModal(false);
      setEditingMember(null);
      fetchData();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update team member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team member? This action cannot be undone.")) return;
    try {
      await apiCall(`/api/admin/team-members/${id}`, { method: "DELETE" });
      showToast("success", "Team member deleted successfully");
      fetchData();
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete team member");
    }
  };

  const toggleClientSelection = (clientId: string, isEdit: boolean) => {
    if (isEdit) {
      const current = editingMember.assignedClients || [];
      const updated = current.includes(clientId)
        ? current.filter((id: string) => id !== clientId)
        : [...current, clientId];
      setEditingMember({ ...editingMember, assignedClients: updated });
    } else {
      const current = newMember.assignedClients;
      const updated = current.includes(clientId)
        ? current.filter((id) => id !== clientId)
        : [...current, clientId];
      setNewMember({ ...newMember, assignedClients: updated });
    }
  };

  const toggleProjectSelection = (projectId: string, isEdit: boolean) => {
    if (isEdit) {
      const current = editingMember.assignedProjects || [];
      const updated = current.includes(projectId)
        ? current.filter((id: string) => id !== projectId)
        : [...current, projectId];
      setEditingMember({ ...editingMember, assignedProjects: updated });
    } else {
      const current = newMember.assignedProjects;
      const updated = current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId];
      setNewMember({ ...newMember, assignedProjects: updated });
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="admin" />
        <div className="flex-1 flex flex-col" style={{ marginLeft: "260px" }}>
          <Header />
          <main className="p-8 max-w-7xl mx-auto w-full relative">
            
            {/* Toast Notifications */}
            {toast && (
              <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl text-xs font-bold border shadow-2xl transition-all animate-shake ${
                toast.type === "success" 
                  ? "bg-green-500/10 text-green-700 border-green-500/20" 
                  : "bg-red-500/10 text-red-700 border-red-500/20"
              }`}>
                {toast.type === "success" ? "✅" : "⚠️"} {toast.text}
              </div>
            )}

            <div className="flex justify-between items-end mb-10">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Team Member Management</h1>
                <p className="text-sm text-slate-500 mt-1">Manage, assign, and customize role filters for team staff.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(true)} 
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200 transition-all"
              >
                + Add Team Member
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Active Staff</h3>
              </div>

              {loading ? (
                <div className="p-20 text-center text-slate-400 italic animate-pulse">Syncing team members...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                           <th className="px-8 py-4">Name & Email</th>
                           <th className="px-8 py-4">Role</th>
                           <th className="px-8 py-4">Assigned Clients</th>
                           <th className="px-8 py-4">Assigned Projects</th>
                           <th className="px-8 py-4">Status</th>
                           <th className="px-8 py-4 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 bg-white">
                        {teamMembers.length > 0 ? (
                          teamMembers.map((member) => (
                             <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-8 py-5">
                                  <div className="font-bold text-sm text-slate-900">{member.name}</div>
                                  <div className="text-xs text-slate-400">{member.email}</div>
                                </td>
                                <td className="px-8 py-5">
                                  <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded bg-indigo-50 border border-indigo-100 text-indigo-700">
                                    {member.role}
                                  </span>
                                </td>
                                <td className="px-8 py-5 text-sm text-slate-600 max-w-[200px] truncate">
                                  {member.assignedClients.length > 0 
                                    ? member.assignedClients.map(c => c.name).join(", ")
                                    : <span className="text-slate-400 italic">None</span>
                                  }
                                </td>
                                <td className="px-8 py-5 text-sm text-slate-600 max-w-[200px] truncate">
                                  {member.assignedProjects.length > 0 
                                    ? member.assignedProjects.map(p => p.name).join(", ")
                                    : <span className="text-slate-400 italic">None</span>
                                  }
                                </td>
                                <td className="px-8 py-5">
                                   <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                                     member.status === "active"
                                       ? "bg-green-50 text-green-700 border-green-100"
                                       : "bg-red-50 text-red-700 border-red-100"
                                   }`}>
                                     {member.status || "Active"}
                                   </span>
                                </td>
                                <td className="px-8 py-5 text-right space-x-4">
                                    <button 
                                      onClick={() => { 
                                        setEditingMember({
                                          ...member,
                                          password: "",
                                          assignedClients: member.assignedClients.map(c => c.id),
                                          assignedProjects: member.assignedProjects.map(p => p.id),
                                        }); 
                                        setShowEditModal(true); 
                                      }} 
                                      className="text-xs font-bold text-indigo-600 hover:underline"
                                    >
                                      Edit
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteMember(member.id)} 
                                      className="text-xs font-bold text-red-600 hover:underline"
                                    >
                                      Delete
                                    </button>
                                </td>
                             </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-16 text-center">
                              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 text-2xl">
                                👥
                              </div>
                              <h4 className="text-base font-bold text-slate-900 mb-1">No Team Members Yet</h4>
                              <p className="text-sm text-slate-500 max-w-[300px] mx-auto">
                                Add your first team member and customize their dashboard client/project visibility permissions.
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

        {/* Create Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Add Team Member</h2>
                  <p className="text-xs text-slate-500">Create new staff with tailored project filters.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
              </div>

              <form className="p-8 space-y-6 overflow-y-auto flex-1" onSubmit={handleAddMember}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-1">Full Name</label>
                      <input 
                        type="text" 
                        placeholder="John Doe" 
                        className="w-full px-5 py-3 bg-slate-50 border rounded-2xl text-sm" 
                        required 
                        value={newMember.name} 
                        onChange={(e) => setNewMember({...newMember, name: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-1">Email Address</label>
                      <input 
                        type="email" 
                        placeholder="john@agency.com" 
                        className="w-full px-5 py-3 bg-slate-50 border rounded-2xl text-sm" 
                        required 
                        value={newMember.email} 
                        onChange={(e) => setNewMember({...newMember, email: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-1">Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className="w-full px-5 py-3 bg-slate-50 border rounded-2xl text-sm" 
                        required 
                        value={newMember.password} 
                        onChange={(e) => setNewMember({...newMember, password: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-1">Role</label>
                      <select 
                        className="w-full px-5 py-3 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-600"
                        value={newMember.role}
                        onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                      >
                        <option value="TEAM_MEMBER">TEAM MEMBER</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2">Assign Clients</label>
                      <div className="border rounded-2xl p-4 bg-slate-50 max-h-[150px] overflow-y-auto space-y-2">
                        {clients.length > 0 ? clients.map((c) => (
                          <label key={c.id} className="flex items-center gap-3 text-xs text-slate-700 font-bold cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={newMember.assignedClients.includes(c.id)}
                              onChange={() => toggleClientSelection(c.id, false)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                            />
                            {c.name}
                          </label>
                        )) : (
                          <div className="text-xs text-slate-400 italic">No clients found</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2">Assign SEO Projects</label>
                      <div className="border rounded-2xl p-4 bg-slate-50 max-h-[150px] overflow-y-auto space-y-2">
                        {projects.length > 0 ? projects.map((p) => (
                          <label key={p.id} className="flex items-center gap-3 text-xs text-slate-700 font-bold cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={newMember.assignedProjects.includes(p.id)}
                              onChange={() => toggleProjectSelection(p.id, false)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                            />
                            {p.projectName}
                          </label>
                        )) : (
                          <div className="text-xs text-slate-400 italic">No projects found</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase shadow-xl shadow-indigo-100 hover:bg-indigo-500 transition-all disabled:opacity-50"
                >
                  {submitting ? "Deploying..." : "Create Team Member"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowEditModal(false)} />
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Edit Team Member</h2>
                  <p className="text-xs text-slate-500">Update staff context and assignment filters.</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
              </div>

              <form className="p-8 space-y-6 overflow-y-auto flex-1" onSubmit={handleUpdateMember}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-1">Full Name</label>
                      <input 
                        type="text" 
                        className="w-full px-5 py-3 bg-slate-50 border rounded-2xl text-sm" 
                        required 
                        value={editingMember.name} 
                        onChange={(e) => setEditingMember({...editingMember, name: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-1">Email Address</label>
                      <input 
                        type="email" 
                        className="w-full px-5 py-3 bg-slate-50 border rounded-2xl text-sm" 
                        required 
                        value={editingMember.email} 
                        onChange={(e) => setEditingMember({...editingMember, email: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-1">Password (leave blank to keep)</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        className="w-full px-5 py-3 bg-slate-50 border rounded-2xl text-sm" 
                        value={editingMember.password || ""} 
                        onChange={(e) => setEditingMember({...editingMember, password: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-1">Status</label>
                      <select 
                        className="w-full px-5 py-3 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-600"
                        value={editingMember.status}
                        onChange={(e) => setEditingMember({...editingMember, status: e.target.value})}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2">Assign Clients</label>
                      <div className="border rounded-2xl p-4 bg-slate-50 max-h-[150px] overflow-y-auto space-y-2">
                        {clients.length > 0 ? clients.map((c) => (
                          <label key={c.id} className="flex items-center gap-3 text-xs text-slate-700 font-bold cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={editingMember.assignedClients.includes(c.id)}
                              onChange={() => toggleClientSelection(c.id, true)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                            />
                            {c.name}
                          </label>
                        )) : (
                          <div className="text-xs text-slate-400 italic">No clients found</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2">Assign SEO Projects</label>
                      <div className="border rounded-2xl p-4 bg-slate-50 max-h-[150px] overflow-y-auto space-y-2">
                        {projects.length > 0 ? projects.map((p) => (
                          <label key={p.id} className="flex items-center gap-3 text-xs text-slate-700 font-bold cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={editingMember.assignedProjects.includes(p.id)}
                              onChange={() => toggleProjectSelection(p.id, true)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                            />
                            {p.projectName}
                          </label>
                        )) : (
                          <div className="text-xs text-slate-400 italic">No projects found</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase shadow-xl shadow-indigo-100 hover:bg-indigo-500 transition-all disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Update Team Member"}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}
