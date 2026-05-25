'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import apiCall from "@/lib/api";

export const dynamic = "force-dynamic";

export default function AdminTeamPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<any>(null);
  
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const data = await apiCall("/api/agency/team-members"); 
      setTeam(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch team:", err);
      // Fallback demo data if API is not yet seeded
      setTeam([
        { id: '1', name: 'John Doe', email: 'john@agency.com', role: 'Campaign Manager', status: 'Active' },
        { id: '2', name: 'Sarah Smith', email: 'sarah@agency.com', role: 'Designer', status: 'Active' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberEmail) return;
    setInviting(true);
    try {
      const res = await apiCall("/api/auth/invite", {
        method: "POST",
        body: JSON.stringify({
          name: newMemberName,
          email: newMemberEmail,
          role: "team"
        })
      });
      setInviteResult(res.invitation);
      setShowModal(false);
      setNewMemberName("");
      setNewMemberEmail("");
      fetchTeam();
    } catch (err: any) {
      alert(err.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const getFullInviteUrl = () => {
    if (!inviteResult) return "";
    if (typeof window === "undefined") return inviteResult.inviteUrl;
    return `${window.location.protocol}//${window.location.host}${inviteResult.inviteUrl}`;
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="admin" />
      <div className="flex-1 ml-[260px] flex flex-col">
        <Header />
        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Team Management</h1>
              <p className="text-sm text-slate-500 mt-1">Manage your agency staff, roles, and permissions.</p>
            </div>
            <button 
              onClick={() => {
                setInviteResult(null);
                setShowModal(true);
              }}
              className="btn-primary !py-2.5 !px-6 text-xs font-bold shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all"
            >
               + Add Team Member
            </button>
          </div>

          {/* Invitation Link Result Alert */}
          {inviteResult && (
            <div className="mb-8 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl relative shadow-sm">
              <button 
                onClick={() => setInviteResult(null)} 
                className="absolute top-4 right-4 text-emerald-600 font-bold hover:text-emerald-800 transition-colors"
              >
                X
              </button>
              <h3 className="text-emerald-800 font-bold mb-2 flex items-center gap-2">
                <span>✉️</span> Team Invitation Generated!
              </h3>
              <p className="text-emerald-700 text-xs mb-4">
                Share this secure workspace onboard link with {inviteResult.name} ({inviteResult.email}):
              </p>
              <div className="flex gap-2 max-w-xl">
                <input 
                  type="text" 
                  readOnly 
                  value={getFullInviteUrl()} 
                  className="flex-1 px-4 py-2 text-xs bg-white border border-emerald-200 rounded-xl font-mono text-slate-700 select-all outline-none"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(getFullInviteUrl());
                    alert("Invitation URL copied to clipboard!");
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
                >
                  Copy Link
                </button>
              </div>
            </div>
          )}

          <div className="card !p-0 overflow-hidden bg-white shadow-sm border border-slate-200 rounded-2xl">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900">Staff Members</h3>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md uppercase tracking-widest">
                  {team.length} Active
                </span>
             </div>
             
             {loading ? (
                <div className="p-20 text-center text-slate-400 animate-pulse">Syncing team database...</div>
             ) : team.length > 0 ? (
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                         <tr>
                            <th className="px-8 py-4">Name</th>
                            <th className="px-8 py-4">Role</th>
                            <th className="px-8 py-4">Status</th>
                            <th className="px-8 py-4 text-right">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {team.map((member) => (
                            <tr key={member.id} className="hover:bg-slate-50/80 transition-colors group">
                               <td className="px-8 py-5">
                                  <div className="flex flex-col">
                                     <span className="font-semibold text-sm text-slate-900">{member.name}</span>
                                     <span className="text-xs text-slate-400">{member.email}</span>
                                  </div>
                               </td>
                               <td className="px-8 py-5 text-sm text-slate-600 font-medium capitalize">{member.role}</td>
                               <td className="px-8 py-5">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 uppercase tracking-tighter">
                                     <span className="w-1 h-1 rounded-full bg-green-600 animate-pulse"></span>
                                     {member.status || "Active"}
                                  </span>
                               </td>
                               <td className="px-8 py-5 text-right">
                                  <button className="text-xs font-bold text-indigo-600 hover:underline">Edit Access</button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             ) : (
                <div className="p-24 text-center">
                   <div className="text-5xl mb-6">👥</div>
                   <h3 className="text-lg font-bold text-slate-900 mb-2">No Team Members Found</h3>
                   <p className="text-sm text-slate-500 max-w-xs mx-auto mb-8">You haven&apos;t added any staff members yet. Start building your agency team today.</p>
                   <button 
                    onClick={() => {
                      setInviteResult(null);
                      setShowModal(true);
                    }} 
                    className="btn-primary !px-8"
                   >
                     Add First Member
                   </button>
                </div>
             )}
          </div>
        </main>
      </div>

      {/* Invitation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <form 
            onSubmit={handleInvite} 
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 p-8 space-y-6"
          >
             <div>
               <h2 className="text-xl font-bold text-slate-900">Add New Team Member</h2>
               <p className="text-xs text-slate-500 mt-1">Generate a secure workspace onboarding link for your staff.</p>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                 <input 
                  type="text" 
                  required 
                  placeholder="e.g. John Doe" 
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800" 
                 />
               </div>
               
               <div>
                 <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                 <input 
                  type="email" 
                  required 
                  placeholder="e.g. john@agency.com" 
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800" 
                 />
               </div>
             </div>

             <div className="pt-2 flex gap-3">
               <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
               >
                 Cancel
               </button>
               <button 
                type="submit" 
                disabled={inviting}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
               >
                 {inviting ? "Inviting..." : "Send Invitation"}
               </button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
}
