'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";
import apiCall from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function TeamClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyClients = async () => {
      try {
        // Fetch clients filtered by tenant but relevant to team
        const data = await apiCall('/agency/clients');
        setClients(data);
      } catch (err) {
        console.error("Error fetching clients:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyClients();
  }, []);

  return (
    <RoleGuard allowedRoles={['team', 'admin']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="team" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Assigned Clients</h1>
              <p className="text-slate-500">Overview of client accounts you are currently managing.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full py-12 text-center text-slate-400 italic">Syncing client portfolio...</div>
              ) : clients.length > 0 ? (
                clients.map((client) => (
                  <div key={client.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl">
                        {client.name?.[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{client.name}</h3>
                        <p className="text-xs text-slate-500">{client.companyName || 'Private Client'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                       <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-400">Email</span>
                          <span className="text-slate-900">{client.email}</span>
                       </div>
                       <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-400">Status</span>
                          <span className={`capitalize ${client.status === 'active' ? 'text-green-600' : 'text-amber-600'}`}>{client.status}</span>
                       </div>
                    </div>

                    <div className="flex gap-3">
                       <button className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">View Workspace</button>
                       <button className="px-3 py-2 bg-slate-50 text-slate-400 rounded-lg hover:text-slate-900 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                       </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400">You don't have any assigned clients yet.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
