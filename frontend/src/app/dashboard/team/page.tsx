'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";

export default function TeamDashboard() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsData, tasksData, projectsData] = await Promise.all([
          apiFetch("/team/clients"),
          apiFetch("/team/tasks"),
          apiFetch("/projects")
        ]);
        setClients(clientsData);
        setTasks(tasksData);
        setProjects(projectsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617]">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const pendingTasks = tasks.filter((t: any) => t.status === 'PENDING' || t.status === 'todo');

  return (
    <div className="flex min-h-screen bg-[#020617] text-white selection:bg-primary/30">
      <Sidebar role="team" />
      
      <div className="flex-1 ml-[280px] min-h-screen bg-grid relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <Header />
        
        <main className="p-10 max-w-[1600px] mx-auto relative z-10 animate-fade-in">
          <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">Operations</span>
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Team Command Center</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white italic">
                Workspace <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">Overview</span>
              </h1>
              <p className="text-slate-400 font-medium max-w-xl text-lg">Manage campaigns, track tasks, and monitor performance for your assigned clients.</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => router.push('/dashboard/team/tasks')}
                className="btn-primary !px-8 !py-3 flex items-center gap-3 shadow-2xl"
              >
                <span className="uppercase text-xs tracking-widest font-black">Open Task Board</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <StatCard 
              label="Assigned Clients" 
              value={clients.length} 
              icon="👥" 
              delay="0s"
              onClick={() => router.push('/dashboard/team/clients')}
            />
            <StatCard 
              label="Active Projects" 
              value={projects.length} 
              icon="🚀" 
              delay="0.1s"
              onClick={() => router.push('/projects')}
            />
            <StatCard 
              label="Pending Tasks" 
              value={pendingTasks.length} 
              icon="✅" 
              delay="0.2s"
              highlight={pendingTasks.length > 0}
              onClick={() => router.push('/dashboard/team/tasks')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 card p-10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
               </div>
               <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Client Portfolio</h3>
                  <button onClick={() => router.push('/dashboard/team/clients')} className="text-[10px] font-black text-primary hover:text-white uppercase tracking-widest transition-colors">View Directory</button>
               </div>
               
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <tr>
                           <th className="px-4 py-3">Client Name</th>
                           <th className="px-4 py-3">Status</th>
                           <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {clients.length > 0 ? clients.slice(0, 5).map((client: any) => (
                          <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group/row cursor-pointer" onClick={() => router.push(`/dashboard/team/clients/${client.id}`)}>
                             <td className="px-4 py-4 font-bold text-sm text-white group-hover/row:text-primary transition-colors">{client.name}</td>
                             <td className="px-4 py-4">
                               <span className={`px-2 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                                 client.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                               }`}>
                                 {client.status?.toUpperCase() || 'ACTIVE'}
                               </span>
                             </td>
                             <td className="px-4 py-4 text-right">
                               <button 
                                 className="w-8 h-8 rounded-lg bg-white/5 inline-flex items-center justify-center text-slate-400 group-hover/row:bg-primary group-hover/row:text-white transition-all"
                               >
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                               </button>
                             </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={3} className="px-4 py-12 text-center">
                              <div className="text-3xl mb-3 opacity-50">📁</div>
                              <p className="text-slate-400 text-sm font-bold tracking-wide">No clients assigned</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Contact your administrator</p>
                            </td>
                          </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>

            <div className="space-y-8">
               <div className="card p-8 border-primary/10">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-6">Recent Activity</h3>
                  <div className="space-y-4">
                     {tasks.length > 0 ? tasks.slice(0, 3).map((task: any, i) => (
                        <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                           <div className={`absolute top-0 left-0 w-1 h-full ${task.status === 'PENDING' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                           <h4 className="text-sm font-bold text-white mb-1">{task.title}</h4>
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{task.client_name || 'General'}</span>
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${task.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                 {task.status}
                              </span>
                           </div>
                        </div>
                     )) : (
                        <div className="text-center py-6">
                           <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No recent tasks</p>
                        </div>
                     )}
                  </div>
                  <button onClick={() => router.push('/dashboard/team/tasks')} className="w-full mt-6 py-3 rounded-xl bg-white/5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                     View All Tasks
                  </button>
               </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, onClick, delay, highlight }: any) {
  return (
    <div 
      onClick={onClick}
      className={`card p-8 relative overflow-hidden group cursor-pointer transition-all duration-500 hover:scale-[1.02] ${highlight ? 'border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]' : ''}`}
      style={{ animationDelay: delay }}
    >
      <div className="absolute top-0 right-0 p-6 text-3xl opacity-20 group-hover:opacity-40 group-hover:scale-125 transition-all duration-500">{icon}</div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">{label}</p>
      <div className="flex items-end justify-between relative z-10">
        <h2 className="text-4xl font-black tracking-tighter text-white italic">{value}</h2>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${highlight ? 'via-amber-500/40' : 'via-primary/20'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
    </div>
  );
}
