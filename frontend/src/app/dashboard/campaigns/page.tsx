'use client';

import { useEffect, useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";
import { getCampaigns, updateCampaignStatus, bulkUpdateStatus, Campaign } from "@/services/campaignService";
import { useAuth } from "@/context/AuthContext";
import { 
  Plus, Search, Filter, MoreHorizontal, Pause, Play, Trash2, Target,
  Download, ExternalLink, BarChart2, TrendingUp, Users, DollarSign,
  ArrowUpRight, ArrowDownRight, MoreVertical
} from "lucide-react";
import Link from "next/link";
import AutomationCenter from "@/components/campaigns/AutomationCenter";

export default function CampaignsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'automation'>('list');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [view, setView] = useState<'table' | 'grid'>('table');

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getCampaigns(user?.role === 'client' ? user.workspaceId : undefined);
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const matchesPlatform = platformFilter === "all" || c.channel === platformFilter;
      return matchesSearch && matchesStatus && matchesPlatform;
    });
  }, [campaigns, searchTerm, statusFilter, platformFilter]);

  const handleBulkAction = async (action: 'active' | 'paused' | 'delete') => {
    if (selectedIds.length === 0) return;
    try {
      if (action === 'delete') {
        // Implement bulk delete
      } else {
        await bulkUpdateStatus(selectedIds, action);
        await fetchData();
        setSelectedIds([]);
      }
    } catch (err) {
      alert("Bulk action failed");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const totals = useMemo(() => {
    return filteredCampaigns.reduce((acc, c) => ({
      spend: acc.spend + (c.spend || 0),
      impressions: acc.impressions + (c.impressions || 0),
      clicks: acc.clicks + (c.clicks || 0),
      conversions: acc.conversions + (c.conversions || 0),
    }), { spend: 0, impressions: 0, clicks: 0, conversions: 0 });
  }, [filteredCampaigns]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 ml-[260px]">
          <Header />
          <div className="p-8 animate-pulse">
            <div className="h-20 bg-white rounded-3xl w-1/3 mb-8" />
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="h-32 bg-white rounded-3xl" />
              <div className="h-32 bg-white rounded-3xl" />
              <div className="h-32 bg-white rounded-3xl" />
              <div className="h-32 bg-white rounded-3xl" />
            </div>
            <div className="h-[400px] bg-white rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-[260px]">
        <Header />
        <main className="p-8 max-w-[1600px] mx-auto">
          {/* Header Section */}
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Campaign Manager</h1>
              <p className="text-slate-500 mt-1">Manage and optimize your cross-channel advertising performance.</p>
            </div>
            {(user?.role === 'admin' || user?.role === 'team') && (
              <Link 
                href="/dashboard/campaigns/new"
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <Plus size={18} /> New Campaign
              </Link>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-8 border-b border-slate-200 mb-8">
            <button 
              onClick={() => setActiveTab('list')}
              className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'list' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Campaign List
              {activeTab === 'list' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('automation')}
              className={`pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === 'automation' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Automation & Forecasting
              {activeTab === 'automation' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />}
            </button>
          </div>

          {activeTab === 'list' ? (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                {[
                  { label: 'Total Spend', value: `$${totals.spend.toLocaleString()}`, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+12.5%', trendUp: true },
                  { label: 'Impressions', value: totals.impressions.toLocaleString(), icon: BarChart2, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+5.2%', trendUp: true },
                  { label: 'Clicks', value: totals.clicks.toLocaleString(), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '-2.1%', trendUp: false },
                  { label: 'Conversions', value: totals.conversions.toLocaleString(), icon: Target, color: 'text-amber-600', bg: 'bg-amber-50', trend: '+8.4%', trendUp: true },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                        <stat.icon size={24} />
                      </div>
                      <span className={`flex items-center text-[10px] font-black px-2 py-1 rounded-full ${stat.trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {stat.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {stat.trend}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 mb-1">{stat.value}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Filters & Actions Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search campaigns or clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <select 
                      value={platformFilter}
                      onChange={(e) => setPlatformFilter(e.target.value)}
                      className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none"
                    >
                      <option value="all">All Platforms</option>
                      <option value="google">Google Ads</option>
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                    </select>
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100 mr-2 animate-in fade-in slide-in-from-right-4">
                      <span className="text-xs font-bold text-indigo-600">{selectedIds.length} Selected</span>
                      <div className="h-4 w-px bg-indigo-200 mx-2" />
                      <button onClick={() => handleBulkAction('active')} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" title="Activate"><Play size={16} /></button>
                      <button onClick={() => handleBulkAction('paused')} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" title="Pause"><Pause size={16} /></button>
                      <button onClick={() => handleBulkAction('delete')} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  )}
                  <button className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-all"><Download size={18} /></button>
                </div>
              </div>

              {/* Main List Area */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 w-12">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds(filteredCampaigns.map(c => c.id));
                            else setSelectedIds([]);
                          }}
                        />
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign & Platform</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Budget & Progress</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">KPIs</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={6} className="px-6 py-8"><div className="h-4 bg-slate-100 rounded w-full" /></td>
                        </tr>
                      ))
                    ) : filteredCampaigns.length > 0 ? (
                      filteredCampaigns.map((c) => (
                        <tr key={c.id} className={`hover:bg-slate-50/80 transition-all ${selectedIds.includes(c.id) ? 'bg-indigo-50/30' : ''}`}>
                          <td className="px-6 py-5">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.includes(c.id)}
                              onChange={() => toggleSelect(c.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm border border-slate-100 ${
                                c.channel === 'google' ? 'bg-red-50 text-red-500' :
                                c.channel === 'facebook' ? 'bg-blue-50 text-blue-500' :
                                'bg-slate-50 text-slate-500'
                              }`}>
                                {c.channel === 'google' ? 'G' : c.channel === 'facebook' ? 'F' : 'T'}
                              </div>
                              <div>
                                <div className="text-sm font-black text-slate-900 hover:text-indigo-600 cursor-pointer">{c.name}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.clientName || 'Direct'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="max-w-[140px]">
                              <div className="flex justify-between text-[10px] font-bold mb-1.5">
                                <span className="text-slate-900">${c.spend?.toLocaleString()}</span>
                                <span className="text-slate-400">/ ${c.budget?.toLocaleString()}</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-600 rounded-full" 
                                  style={{ width: `${Math.min(((c.spend || 0) / (c.budget || 1)) * 100, 100)}%` }} 
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                              <div className="text-[10px] font-bold text-slate-400 uppercase">CTR</div>
                              <div className="text-[10px] font-black text-slate-900">{((c.clicks / (c.impressions || 1)) * 100).toFixed(2)}%</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase">CPC</div>
                              <div className="text-[10px] font-black text-slate-900">${((c.spend || 0) / (c.clicks || 1)).toFixed(2)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              c.status === 'active' ? 'bg-green-50 text-green-600 border border-green-100' : 
                              c.status === 'paused' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                              'bg-slate-50 text-slate-500 border border-slate-100'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${c.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`} />
                              {c.status}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-2">
                              <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><ExternalLink size={16} /></button>
                              <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"><MoreVertical size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-24 text-center">
                          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner border border-slate-100">
                            🔭
                          </div>
                          <h3 className="text-xl font-black text-slate-900 mb-2">No campaigns matched your filters</h3>
                          <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
                            Try adjusting your search terms or filter criteria to find the campaigns you're looking for.
                          </p>
                          <button 
                            onClick={() => { setSearchTerm(""); setStatusFilter("all"); setPlatformFilter("all"); }}
                            className="mt-6 px-6 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
                          >
                            Reset All Filters
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                
                {/* Pagination */}
                {!loading && filteredCampaigns.length > 0 && (
                  <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500">Showing 1 to {filteredCampaigns.length} of {filteredCampaigns.length} results</span>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-400 cursor-not-allowed">Previous</button>
                      <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 shadow-sm hover:bg-slate-50 transition-all">Next</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <AutomationCenter />
          )}
        </main>
      </div>
    </div>
  );
}
