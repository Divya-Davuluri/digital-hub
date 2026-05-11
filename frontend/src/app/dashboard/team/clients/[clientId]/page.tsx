'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import apiCall from "@/lib/api";

export default function ClientDetailsPage() {
  const params = useParams();
  const clientId = params.clientId;
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    
    const fetchData = async () => {
      try {
        const [clientData, campaignsData, tasksData] = await Promise.all([
          apiCall(`/clients/${clientId}`),
          apiCall(`/agency/campaigns?clientId=${clientId}`),
          apiCall(`/team/tasks`)
        ]);
        setClient(clientData);
        setCampaigns(campaignsData);
        // Filter tasks for this client
        setTasks(tasksData.filter((t: any) => 
          t.clientName === clientData.name || 
          t.clientName === clientData.companyName || 
          t.clientName === 'Nike Marketing' // Fallback for seed data
        ));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [clientId]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!client) return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="team" />
      <div className="flex-1 ml-[260px] flex flex-col items-center justify-center">
        <p className="text-slate-500 font-bold">Client not found.</p>
        <button onClick={() => router.back()} className="text-indigo-600 font-bold mt-4">Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="team" />
      <div className="flex-1 ml-[260px] flex flex-col">
        <Header />
        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <button onClick={() => router.push('/dashboard/team/clients')} className="text-xs font-bold text-slate-500 hover:text-slate-900 mb-2 flex items-center gap-1">
                ← Back to Clients
              </button>
              <h1 className="text-3xl font-bold text-slate-900">{client.name}</h1>
              <p className="text-sm text-slate-500 font-medium">{client.companyName || 'Assigned Account'}</p>
            </div>
            <button 
              onClick={() => router.push('/dashboard/team/tasks')}
              className="btn-primary !py-2.5 !px-6 text-xs font-bold shadow-lg shadow-indigo-100"
            >
              + Add Task
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="card !p-0 overflow-hidden bg-white shadow-sm border border-slate-200 rounded-2xl">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">Active Campaigns</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {campaigns.length > 0 ? campaigns.map((campaign) => (
                    <div key={campaign.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{campaign.name}</h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mt-1 uppercase ${
                          campaign.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-500'
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">${campaign.budget}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Budget</p>
                      </div>
                    </div>
                  )) : (
                    <div className="p-10 text-center text-slate-500 text-sm italic">
                      No active campaigns found.
                    </div>
                  )}
                </div>
              </div>

              <div className="card bg-white shadow-sm border border-slate-200 rounded-2xl">
                <h3 className="text-base font-bold text-slate-900 mb-6">Performance Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Clicks</p>
                    <p className="text-2xl font-black text-slate-900">2.4k</p>
                  </div>
                  <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100/50">
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Conv.</p>
                    <p className="text-2xl font-black text-slate-900">142</p>
                  </div>
                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">CTR</p>
                    <p className="text-2xl font-black text-slate-900">4.2%</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">ROAS</p>
                    <p className="text-2xl font-black text-slate-900">3.8x</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="card bg-white shadow-sm border border-slate-200 rounded-2xl">
                <h3 className="text-base font-bold text-slate-900 mb-6">Client Tasks</h3>
                <div className="space-y-4">
                  {tasks.length > 0 ? tasks.map((task) => (
                    <div key={task.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-200 transition-all cursor-pointer group">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{task.title}</p>
                      <div className="flex justify-between items-center mt-3">
                         <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                            task.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'
                         }`}>{task.priority}</span>
                         <span className="text-[10px] font-bold text-slate-400">{task.dueDate}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-6">
                      <div className="text-2xl mb-2">✨</div>
                      <p className="text-xs text-slate-500 font-bold">ALL TASKS COMPLETE</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
