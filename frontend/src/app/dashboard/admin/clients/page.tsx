'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

import ClientOnboardingWizard from '@/components/ClientOnboardingWizard';

export default function AdminClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

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

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
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
               onClick={() => setShowWizard(true)}
               className="btn-primary !py-2.5 !px-6 text-xs font-bold shadow-lg shadow-indigo-100"
            >
               + Add New Client
            </button>
          </div>

          <div className="card !p-0 overflow-hidden">
             <div className="p-6 border-b border-border bg-white">
                <h3 className="text-base font-bold text-slate-900">All Agency Clients</h3>
             </div>
             
             {loading ? (
               <div className="p-12 text-center text-slate-400">Loading Client Directory...</div>
             ) : clients.length > 0 ? (
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                           <th className="px-8 py-4">Client</th>
                           <th className="px-8 py-4">Email Address</th>
                           <th className="px-8 py-4">Status</th>
                           <th className="px-8 py-4 text-right">Settings</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 bg-white">
                        {clients.map((client) => (
                           <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-8 py-5 font-semibold text-sm text-slate-900">{client.name}</td>
                              <td className="px-8 py-5 text-sm text-slate-500">{client.email}</td>
                              <td className="px-8 py-5">
                                 <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${client.status === 'ACTIVE' || !client.status ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                    {client.status || 'Active'}
                                 </span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                 <Link 
                                   href={`/dashboard/admin/clients/${client.id}/settings`}
                                   className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors inline-block"
                                 >
                                   Edit Settings
                                 </Link>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
             ) : (
               <div className="p-20 text-center bg-white">
                  <div className="text-4xl mb-4">🏢</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No Clients Found</h3>
                  <p className="text-sm text-slate-500 mb-6">Start by adding your first agency client workspace.</p>
                  <button onClick={() => setShowWizard(true)} className="text-sm font-bold text-indigo-600 hover:underline">Add First Client →</button>
               </div>
             )}
          </div>
        </main>
      </div>

      <ClientOnboardingWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={(newClient) => {
          setShowWizard(false);
          fetchClients();
          alert(`Client ${newClient.name} added successfully!`);
        }}
      />
    </div>
  );
}
