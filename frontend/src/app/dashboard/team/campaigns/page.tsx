'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";
import { getCampaigns, Campaign } from "@/services/campaignService";
import { useAuth } from "@/context/AuthContext";
import apiCall from "@/lib/api";

export default function TeamCampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    budget: '',
    platform: 'google',
    channel: 'google'
  });

  useEffect(() => {
    fetchTeamCampaigns();
  }, [user]);

  const fetchTeamCampaigns = async () => {
    try {
      const data = await getCampaigns(user?.workspaceId || undefined);
      setCampaigns(data);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        name: campaign.name,
        budget: campaign.budget.toString(),
        platform: (campaign as any).platform || campaign.channel,
        channel: campaign.channel
      });
    } else {
      setEditingCampaign(null);
      setFormData({ name: '', budget: '', platform: 'google', channel: 'google' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCampaign) {
        await apiCall(`/agency/campaigns/${editingCampaign.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            ...formData,
            budget: Number(formData.budget)
          })
        });
      } else {
        await apiCall('/agency/campaigns', {
          method: 'POST',
          body: JSON.stringify({
            ...formData,
            budget: Number(formData.budget),
            workspaceId: user?.workspaceId
          })
        });
      }
      setIsModalOpen(false);
      fetchTeamCampaigns();
    } catch (err) {
      alert("Action failed");
    }
  };

  return (
    <RoleGuard allowedRoles={['team', 'admin']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="team" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8">
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Active Campaigns</h1>
                <p className="text-slate-500">Managing performance for assigned client accounts.</p>
              </div>
              <button 
                onClick={() => handleOpenModal()}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors"
              >
                + Create Campaign
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full py-12 text-center text-slate-400 italic">Syncing active campaigns...</div>
              ) : campaigns.length > 0 ? (
                campaigns.map((c) => (
                  <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        c.channel === 'google' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {c.channel}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${c.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">{c.name}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">{c.clientName || 'Standard Account'}</p>
                    
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spend</p>
                        <p className="font-bold text-slate-900">${c.spend?.toLocaleString() || '0'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budget</p>
                        <p className="font-bold text-indigo-600">${c.budget.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex gap-2">
                       <button className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition-colors">Details</button>
                       <button 
                        onClick={() => handleOpenModal(c)}
                        className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-xs font-bold text-white transition-colors"
                       >
                         Edit
                       </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400">No campaigns assigned to your workspace yet.</p>
                </div>
              )}
            </div>

            {/* Modal */}
            {isModalOpen && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Campaign Name</label>
                      <input 
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Platform</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none"
                        value={formData.platform}
                        onChange={e => setFormData({...formData, platform: e.target.value, channel: e.target.value as any})}
                      >
                        <option value="google">Google Ads</option>
                        <option value="facebook">Facebook Ads</option>
                        <option value="tiktok">TikTok</option>
                        <option value="linkedin">LinkedIn</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Monthly Budget ($)</label>
                      <input 
                        required
                        type="number"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.budget}
                        onChange={e => setFormData({...formData, budget: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 py-3 bg-slate-50 text-slate-500 font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors"
                      >
                        {editingCampaign ? 'Save Changes' : 'Create Campaign'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
