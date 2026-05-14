'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { apiCall } from '@/lib/api';
import { 
  FileText, Download, Filter, Search, 
  Calendar, CheckCircle2, Clock, AlertCircle,
  MoreVertical, ExternalLink, Plus, X, Trash2, 
  RefreshCw, Loader2, ArrowRight, BarChart3,
  ChevronRight, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function UnifiedReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [dateFilter, setDateFilter] = useState('Last 30 Days');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    report_name: '',
    report_type: 'Performance',
    period: 'Last 30 Days',
    workspace_id: '',
    client_id: '',
    campaign_id: '',
    client_name: '',
    campaign: 'All Campaigns'
  });

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    fetchReports();
    fetchData();
  }, [typeFilter, dateFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await apiCall(`/reports?type=${typeFilter}&period=${dateFilter}`);
      const reportList = response.reports || response.data || (Array.isArray(response) ? response : []);
      setReports(reportList);
    } catch (err) {
      console.error("Failed to load reports:", err);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [cData, campData] = await Promise.all([
        apiCall('/agency/clients'),
        apiCall('/campaigns')
      ]);
      setWorkspaces(Array.isArray(cData) ? cData : []);
      setCampaigns(Array.isArray(campData) ? campData : []);
    } catch (err) {
      console.error("Failed to load form data", err);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.report_name || !formData.client_id) {
      toast.error("Please fill required fields");
      return;
    }

    setCreating(true);
    try {
      const res = await apiCall('/reports', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (res.success) {
        toast.success("Report generated successfully!");
        setIsModalOpen(false);
        await fetchReports();
        setFormData({
          report_name: '', report_type: 'Performance', period: 'Last 30 Days',
          workspace_id: '', client_id: '', campaign_id: '', client_name: '', campaign: 'All Campaigns'
        });
      } else {
        toast.error(res.error || "Failed to generate report");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate report");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    try {
      await apiCall(`/reports/${id}`, { method: 'DELETE' });
      toast.success("Report deleted");
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      toast.error("Failed to delete report");
    }
  };

  const handleDownload = async (report: any) => {
    try {
      const downloadUrl = report.file_url || report.url;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://digital-hub-1.onrender.com/api'}${downloadUrl}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${(report.report_name || report.name).replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed to download PDF");
    }
  };

  const filteredReports = reports.filter(r => 
    (r.report_name || r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.client_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Subtle Background Elements */}
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

        <Header />
        
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-12 scrollbar-hide">
          <div className="max-w-[1400px] mx-auto space-y-10">
            
            {/* Page Title Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm tracking-widest uppercase">
                  <BarChart3 size={16} />
                  Analytics Center
                </div>
                <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                  Reporting <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Hub</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium max-w-xl">
                  Strategic performance insights and campaign analysis for your workspaces.
                </p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.02, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsModalOpen(true)}
                className="group flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[24px] font-bold shadow-xl shadow-indigo-200/50 hover:bg-indigo-700 transition-all"
              >
                <Plus size={20} strokeWidth={3} />
                <span>Request New Report</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform opacity-50" />
              </motion.button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white/80 backdrop-blur-xl p-3 rounded-[32px] border border-white shadow-xl shadow-slate-200/40 flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search by report name or client..."
                  className="w-full pl-14 pr-6 py-4 bg-slate-50/50 rounded-[24px] text-base font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none border-none transition-all placeholder:text-slate-400"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-3 pr-2">
                <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden lg:block" />
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden lg:block">Filter by</span>
                  <select 
                    className="px-6 py-4 bg-slate-50 rounded-[20px] text-sm font-bold text-slate-700 outline-none border-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer hover:bg-slate-100"
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                  >
                    <option>All Types</option>
                    <option value="PERFORMANCE">Performance</option>
                    <option value="CAMPAIGN">Campaign Detail</option>
                    <option value="ANALYTICS">Analytics Deep-dive</option>
                    <option value="BUDGET">Budget Allocation</option>
                  </select>

                  <select 
                    className="px-6 py-4 bg-slate-50 rounded-[20px] text-sm font-bold text-slate-700 outline-none border-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer hover:bg-slate-100"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                  >
                    <option>All Time</option>
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>Last 90 Days</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reports Table Area */}
            <div className="bg-white/70 backdrop-blur-md rounded-[40px] border border-white shadow-2xl shadow-slate-200/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/30 border-b border-slate-100/80">
                      <th className="pl-10 pr-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Report Metadata</th>
                      <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Client Context</th>
                      <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Timeframe</th>
                      <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
                      <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Generation Status</th>
                      <th className="pl-6 pr-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                    {loading && reports.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-32 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                              <Loader2 className="text-indigo-600 animate-spin" size={48} />
                              <div className="absolute inset-0 bg-indigo-600/20 blur-xl animate-pulse rounded-full" />
                            </div>
                            <p className="text-slate-400 font-bold text-lg">Synchronizing data...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-32 text-center">
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-6"
                          >
                            <div className="w-24 h-24 bg-slate-100 rounded-[32px] flex items-center justify-center text-slate-300">
                              <LayoutGrid size={48} />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-2xl font-black text-slate-800 tracking-tight">No reports detected</h3>
                              <p className="text-slate-400 max-w-xs mx-auto font-medium">
                                Start by requesting a new report for your client campaigns.
                              </p>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((report, idx) => (
                        <motion.tr 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          key={report.id} 
                          className="hover:bg-slate-50/80 transition-all group relative"
                        >
                          <td className="pl-10 pr-6 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                                <FileText size={24} />
                              </div>
                              <div>
                                <div className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors">
                                  {report.report_name || report.name}
                                </div>
                                <div className="text-xs text-slate-400 font-bold flex items-center gap-1.5 mt-1">
                                  <Clock size={12} />
                                  {new Date(report.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex flex-col gap-1">
                              <div className="font-black text-slate-700 text-sm tracking-tight">
                                {report.client_name || 'Direct Workspace'}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg w-fit uppercase tracking-wider">
                                Client Unit
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-500 bg-slate-100/80 px-4 py-2 rounded-[14px] w-fit border border-slate-200/50">
                              <Calendar size={14} className="text-slate-400" />
                              {report.period}
                            </div>
                          </td>
                          <td className="px-6 py-6">
                             <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-xl border border-purple-100 w-fit">
                               <BarChart3 size={14} className="text-purple-600" />
                               <span className="text-xs font-black text-purple-700 uppercase tracking-wider">
                                 {report.type}
                               </span>
                             </div>
                          </td>
                          <td className="px-6 py-6">
                            {report.status === 'completed' || report.status === 'READY' ? (
                              <div className="flex items-center gap-2 text-emerald-600 font-black text-[11px] bg-emerald-50 px-4 py-2 rounded-full w-fit border border-emerald-100 uppercase tracking-widest shadow-sm">
                                <CheckCircle2 size={14} strokeWidth={3} />
                                Completed
                              </div>
                            ) : report.status === 'failed' ? (
                              <div className="flex items-center gap-2 text-rose-600 font-black text-[11px] bg-rose-50 px-4 py-2 rounded-full w-fit border border-rose-100 uppercase tracking-widest shadow-sm">
                                <AlertCircle size={14} strokeWidth={3} />
                                Failed
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-amber-600 font-black text-[11px] bg-amber-50 px-4 py-2 rounded-full w-fit border border-amber-100 uppercase tracking-widest shadow-sm">
                                <Clock size={14} className="animate-spin-slow" />
                                Processing
                              </div>
                            )}
                          </td>
                          <td className="pl-6 pr-10 py-6 text-right">
                            <div className="flex justify-end items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <motion.button 
                                whileHover={{ scale: 1.1, backgroundColor: '#4f46e5', color: '#ffffff' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDownload(report)}
                                className="p-3 text-indigo-600 bg-indigo-50 rounded-xl transition-all shadow-sm border border-indigo-100"
                                title="Download Full Report"
                              >
                                <Download size={20} strokeWidth={2.5} />
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.1, backgroundColor: '#ef4444', color: '#ffffff' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteReport(report.id)}
                                className="p-3 text-rose-500 bg-rose-50 rounded-xl transition-all shadow-sm border border-rose-100"
                                title="Permanently Delete"
                              >
                                <Trash2 size={20} strokeWidth={2.5} />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>

        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 40 }}
                className="relative w-full max-w-2xl bg-white rounded-[48px] shadow-2xl overflow-hidden border border-white"
              >
                <div className="p-10 lg:p-14">
                  <div className="flex justify-between items-start mb-10">
                    <div className="space-y-2">
                      <div className="text-indigo-600 font-black text-xs uppercase tracking-[0.3em] mb-2">Configuration</div>
                      <h2 className="text-4xl font-black text-slate-900 tracking-tight">Generate Strategy</h2>
                      <p className="text-slate-500 text-lg font-medium">Define your parameters for the performance engine.</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-100 rounded-full transition-all group active:scale-90">
                      <X size={28} className="text-slate-400 group-hover:text-slate-600" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateReport} className="grid grid-cols-2 gap-8">
                    <div className="col-span-2 space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Report Designation</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Q2 Performance Roadmap"
                        className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[24px] text-lg font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                        value={formData.report_name}
                        onChange={e => setFormData({...formData, report_name: e.target.value})}
                      />
                    </div>

                    <div className="col-span-2 space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Client Entity</label>
                      <select 
                        required
                        className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[24px] text-lg font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all cursor-pointer appearance-none"
                        value={formData.client_id}
                        onChange={e => {
                          const ws = workspaces.find(w => w.id === e.target.value);
                          setFormData({
                            ...formData, 
                            client_id: e.target.value, 
                            client_name: ws?.companyName || ws?.name || '',
                            workspace_id: ws?.workspace_id || ws?.workspaceId || ''
                          });
                        }}
                      >
                        <option value="">Choose a Client...</option>
                        {workspaces.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.companyName || w.name} ({w.workspace_slug || 'SaaS'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Campaign Anchor</label>
                      <select 
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[20px] text-base font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all cursor-pointer appearance-none"
                        value={formData.campaign_id}
                        onChange={e => {
                          const camp = campaigns.find(c => c.id === e.target.value);
                          setFormData({
                            ...formData, 
                            campaign_id: e.target.value,
                            campaign: camp?.name || 'All Campaigns'
                          });
                        }}
                      >
                        <option value="">Global Performance</option>
                        {campaigns.filter(c => (c.workspaceId || c.workspace_id) === formData.workspace_id).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Analytics Type</label>
                      <select 
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[20px] text-base font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all cursor-pointer appearance-none"
                        value={formData.report_type}
                        onChange={e => setFormData({...formData, report_type: e.target.value})}
                      >
                        <option value="PERFORMANCE">Performance Metrics</option>
                        <option value="CAMPAIGN">Campaign Deep-Dive</option>
                        <option value="ANALYTICS">User Analytics</option>
                        <option value="BUDGET">Budget Efficiency</option>
                      </select>
                    </div>

                    <div className="col-span-2 space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Temporal Window</label>
                      <div className="grid grid-cols-4 gap-3">
                        {['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'This Month'].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setFormData({...formData, period: p})}
                            className={`py-4 rounded-2xl text-sm font-black transition-all ${
                              formData.period === p 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            {p.replace('Last ', '')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-2 pt-10 flex gap-6">
                      <motion.button 
                        whileHover={{ backgroundColor: '#F1F5F9' }}
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 px-8 py-5 bg-slate-50 text-slate-600 rounded-[24px] font-black tracking-widest text-sm transition-all"
                      >
                        DISCARD
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.02, translateY: -2 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={creating}
                        className="flex-[2] px-8 py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-[24px] font-black tracking-widest text-sm shadow-xl shadow-indigo-200/50 hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        {creating ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} strokeWidth={3} />}
                        INITIATE ENGINE
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
