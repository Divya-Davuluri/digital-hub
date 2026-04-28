'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";

export const dynamic = "force-dynamic";

export default function AdminTeamPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        // Fetching team members - adjusting to standard API path
        const data = await apiFetch("/admin/team"); 
        setTeam(data);
      } catch (err) {
        console.error("Failed to fetch team:", err);
        // Fallback demo data if API is not yet ready
        setTeam([
          { id: '1', name: 'John Doe', email: 'john@agency.com', role: 'Campaign Manager', status: 'Active' },
          { id: '2', name: 'Sarah Smith', email: 'sarah@agency.com', role: 'Designer', status: 'Active' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

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
              onClick={() => setShowModal(true)}
              className="btn-primary !py-2.5 !px-6 text-xs font-bold shadow-lg shadow-indigo-100"
            >
               + Add Team Member
            </button>
          </div>

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
                               <td className="px-8 py-5 text-sm text-slate-600">{member.role}</td>
                               <td className="px-8 py-5">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 uppercase tracking-tighter">
                                     <span className="w-1 h-1 rounded-full bg-green-600"></span>
                                     {member.status}
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
                   <button onClick={() => setShowModal(true)} className="btn-primary !px-8">Add First Member</button>
                </div>
             )}
          </div>
        </main>
      </div>

      {/* Modal Placeholder */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 p-8">
             <h2 className="text-xl font-bold mb-4">Add New Team Member</h2>
             <p className="text-sm text-slate-500 mb-6">Invitations will be sent via email to join your agency workspace.</p>
             <input type="text" placeholder="Full Name" className="input-field mb-4" />
             <input type="email" placeholder="Email Address" className="input-field mb-6" />
             <button className="w-full btn-primary py-3" onClick={() => setShowModal(false)}>Send Invitation</button>
          </div>
        </div>
      )}
    </div>
  );
}
