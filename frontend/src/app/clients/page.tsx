'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

import apiCall from '@/lib/api';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', companyName: '', status: 'active' });

  const fetchClients = async () => {
    try {
      const data = await apiCall('/clients');
      setClients(data);
    } catch (err) {
      console.error('Fetch clients error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCall('/clients', {
        method: 'POST',
        body: JSON.stringify(newClient),
      });
      setIsModalOpen(false);
      setNewClient({ name: '', email: '', companyName: '', status: 'active' });
      fetchClients();
    } catch (err) {
      alert('Failed to add client');
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm('Are you sure you want to delete this client? This will also delete their workspace.')) {
      try {
        await apiCall(`/clients/${id}`, { method: 'DELETE' });
        fetchClients();
      } catch (err) {
        alert('Failed to delete client');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-text">
      <Sidebar />
      
      <div className="flex-1 ml-64 min-h-screen bg-grid relative">
        <Header />
        
        <main className="p-8 max-w-[1400px] mx-auto animate-fade-in">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
              <div className="w-10 h-10 border-4 border-white/10 border-t-primary rounded-full animate-spin"></div>
              <p className="text-text-muted font-bold text-xs uppercase tracking-widest">Fetching Portfolio...</p>
            </div>
          ) : (
            <>
              <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div>
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] hover:text-primary transition-all mb-4 group"
              >
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
              <h1 className="text-4xl font-black tracking-tight text-white mb-2">Partner Portfolio</h1>
              <p className="text-text-muted font-medium">Managing relationships with your high-growth agency clients.</p>
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-primary !px-8 flex items-center gap-3 shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Register New Client
            </button>
          </header>

          <div className="card p-0 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <h3 className="font-black text-xl uppercase tracking-tight">Active Accounts</h3>
                <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">{clients.length} Total</span>
              </div>
              <div className="flex items-center gap-4">
                <input 
                  type="text" 
                  placeholder="Filter by name or industry..." 
                  className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 w-64"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                    <th className="px-8 py-4">Client Identity</th>
                    <th className="px-8 py-4">Email Address</th>
                    <th className="px-8 py-4">Engagement Status</th>
                    <th className="px-8 py-4">Workspace Slug</th>
                    <th className="px-8 py-4 text-right">System Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group cursor-default">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 flex items-center justify-center font-black text-xs text-text-muted group-hover:text-primary transition-colors">
                            {client.name[0]}
                          </div>
                          <div>
                            <div className="font-black text-white group-hover:text-primary transition-colors">{client.name}</div>
                            <div className="text-[9px] font-black text-text-muted uppercase tracking-widest mt-0.5">{client.companyName || 'No Company'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-medium text-text-muted">{client.email}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          client.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-primary/10 text-primary'
                        }`}>
                          <span className={`w-1 h-1 rounded-full mr-2 ${client.status === 'active' ? 'bg-green-400' : 'bg-primary'}`}></span>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-mono text-[10px] font-bold text-white/40">{client.workspace_slug || client.workspaceId?.slice(0,8)}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-text-muted hover:text-primary hover:bg-white/10 transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteClient(client.id)}
                            className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>
          )}
        </main>
      </div>

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-fade-in">
          <div className="glass-panel w-full max-w-md shadow-2xl overflow-hidden scale-in">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-xl font-black uppercase tracking-tight">Onboard New Client</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-white transition-colors p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddClient} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Client Entity Name</label>
                <input 
                  type="text" 
                  required
                  value={newClient.name}
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  placeholder="e.g. Acme Corp"
                  className="input-field"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Business Vertical</label>
                <input 
                  type="text" 
                  required
                  value={newClient.industry}
                  onChange={(e) => setNewClient({...newClient, industry: e.target.value})}
                  placeholder="e.g. Technology"
                  className="input-field"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Status</label>
                  <select 
                    value={newClient.status}
                    onChange={(e) => setNewClient({...newClient, status: e.target.value})}
                    className="input-field appearance-none cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Target Revenue</label>
                  <input 
                    type="text" 
                    required
                    value={newClient.revenue}
                    onChange={(e) => setNewClient({...newClient, revenue: e.target.value})}
                    placeholder="e.g. $5,000/mo"
                    className="input-field font-mono"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 btn-secondary"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Confirm Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
