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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617]">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#020617] text-white selection:bg-primary/30 relative">
      <Sidebar role="admin" />
      
      <div className="flex-1 ml-[280px] min-h-screen bg-grid relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <Header />
        
        <main className="p-10 max-w-[1600px] mx-auto relative z-10 animate-fade-in">
          <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">Directory</span>
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Workspace Management</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white italic">
                Agency <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">Clients</span>
              </h1>
              <p className="text-slate-400 font-medium max-w-xl text-lg">Add, edit, and manage all client workspaces from this central executive console.</p>
            </div>
            <div className="flex gap-4">
              <button 
                 onClick={() => setShowWizard(true)}
                 className="btn-primary !px-8 !py-3 flex items-center gap-3 shadow-2xl"
              >
                 <span className="uppercase text-xs tracking-widest font-black">Initialize Workspace</span>
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          </header>

          <div className="card !p-0 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
             </div>
             
             <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center relative z-10">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Global Directory</h3>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Active:</span>
                   <span className="text-[10px] font-black text-primary uppercase tracking-widest px-2 py-0.5 bg-primary/10 rounded-full">{clients.length}</span>
                </div>
             </div>
             
             {clients.length > 0 ? (
               <div className="overflow-x-auto relative z-10">
                  <table className="w-full text-left">
                     <thead className="bg-white/[0.02] text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                        <tr>
                           <th className="px-8 py-4">Client Identity</th>
                           <th className="px-8 py-4">Protocol Entry</th>
                           <th className="px-8 py-4">System Status</th>
                           <th className="px-8 py-4 text-right">Operations</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {clients.map((client) => (
                           <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group/row">
                              <td className="px-8 py-6 font-black text-sm text-white group-hover/row:text-primary transition-colors flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-lg">
                                  {client.name.charAt(0)}
                                </div>
                                {client.name}
                              </td>
                              <td className="px-8 py-6 text-xs text-slate-400 font-bold tracking-wide">{client.email}</td>
                              <td className="px-8 py-6">
                                 <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${client.status === 'ACTIVE' || !client.status ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                                    {client.status || 'Active'}
                                 </span>
                              </td>
                              <td className="px-8 py-6 text-right">
                                 <Link 
                                   href={`/dashboard/admin/clients/${client.id}/settings`}
                                   className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white px-4 py-2 rounded-lg bg-white/5 hover:bg-primary transition-colors inline-block"
                                 >
                                   Configure
                                 </Link>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
             ) : (
               <div className="p-24 text-center relative z-10">
                  <div className="text-5xl mb-6 opacity-30">🏢</div>
                  <h3 className="text-2xl font-black text-white mb-2 italic tracking-tighter uppercase">No Workspaces Found</h3>
                  <p className="text-sm font-bold text-slate-500 mb-8 uppercase tracking-widest">System directory is currently empty.</p>
                  <button onClick={() => setShowWizard(true)} className="text-[10px] font-black text-primary hover:text-white uppercase tracking-widest border-b border-primary/30 hover:border-white transition-colors pb-1">
                    Initialize First Client →
                  </button>
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
