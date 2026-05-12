'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import apiCall from "@/lib/api";
import RoleGuard from "@/components/RoleGuard";

export default function TeamAssignedClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignedClients = async () => {
      try {
        setLoading(true);
        const data = await apiCall("/api/agency/clients");
        setClients(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignedClients();
  }, []);

  return (
    <RoleGuard allowedRoles={['team']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="team" />
        <div className="flex-1 ml-[260px] flex flex-col">
          <Header />
          <main className="p-8 max-w-7xl mx-auto w-full">
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-slate-900">Assigned Clients</h1>
              <p className="text-sm text-slate-500 mt-1">Manage performance and campaigns for your assigned client accounts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full py-12 text-center text-slate-400 italic">Syncing assigned accounts...</div>
              ) : clients.length > 0 ? (
                clients.map((client) => (
                  <div key={client.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-xl font-bold">
                        {client.company_name?.[0] || client.name[0]}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        client.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {client.status}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{client.company_name || client.name}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">{client.plan} Plan</p>
                    
                    <div className="space-y-3 mb-8">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Contact</span>
                        <span className="text-slate-900 font-medium">{client.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Email</span>
                        <span className="text-slate-900 font-medium truncate ml-4" title={client.email}>{client.email}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => window.location.href = `/dashboard/campaigns?workspaceId=${client.workspace_id}`}
                      className="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-colors"
                    >
                      View Campaigns
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="text-4xl mb-4 opacity-30">👥</div>
                  <h3 className="text-lg font-bold text-slate-900">No Assigned Clients</h3>
                  <p className="text-sm text-slate-500">You haven't been assigned to any client workspaces yet.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
