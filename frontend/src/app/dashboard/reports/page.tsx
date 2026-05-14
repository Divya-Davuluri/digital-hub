'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { apiCall } from '@/lib/api';
import { 
  FileText, Download, Filter, Search, 
  Calendar, CheckCircle2, Clock, AlertCircle,
  MoreVertical, ExternalLink, Plus, X, Trash2, 
  RefreshCw, Loader2
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

  // FIX 5: Load reports on mount and when filters change
  useEffect(() => {
    fetchReports();
    fetchData();
  }, [typeFilter, dateFilter]);

  // FIX 2 & 6: Comprehensive fetchReports with debugging
  const fetchReports = async () => {
    setLoading(true);
    try {
      console.log("[DEBUG] Fetching reports with filters:", { typeFilter, dateFilter });
      const response = await apiCall(`/reports?type=${typeFilter}&period=${dateFilter}`);
      
      console.log("[DEBUG] Raw API response:", response);
      
      // Handle various response structures (FIX 2)
      const reportList = response.reports || response.data || (Array.isArray(response) ? response : []);
      
      console.log("[DEBUG] Reports array:", reportList);
      console.log("[DEBUG] Reports count:", reportList.length);
      
      setReports(reportList);
    } catch (err) {
      console.error("[DEBUG] Failed to load reports:", err);
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

  // FIX 1: Refetch after successful creation
  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.report_name || !formData.client_id) {
      toast.error("Please fill required fields");
      return;
    }

    setCreating(true);
    try {
      console.log("[DEBUG] Creating report payload:", formData);
      const res = await apiCall('/reports', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      console.log("[DEBUG] Create report response:", res);

      if (res.success) {
        toast.success("Report generated successfully!");
        setIsModalOpen(false);
        
        // Option 1: Immediate optimistic update
        const newReport = res.data?.data || res.data || res.report;
        if (newReport) {
           setReports(prev => [newReport, ...prev]);
        }
        
        // Option 2: Full refetch (FIX 1)
        await fetchReports();
        
        setFormData({
          report_name: '', report_type: 'Performance', period: 'Last 30 Days',
          workspace_id: '', client_id: '', campaign_id: '', client_name: '', campaign: 'All Campaigns'
        });
      } else {
        toast.error(res.error || "Failed to generate report");
      }
    } catch (err: any) {
      console.error("[DEBUG] Create report error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Failed to generate report";
      toast.error(errorMsg);
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://digital-hub-1.onrender.com/api'}${report.file_url}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${report.report_name.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download PDF");
    }
  };

  const filteredReports = reports.filter(r => 
    (r.report_name || r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.client_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-800">Reports Engine</h1>
                <p className="text-slate-500">Manage and track performance reports for all workspaces.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
              >
                <Plus size={20} />
                Request New Report
              </button>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search reports..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none border-none"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select 
                className="px-4 py-3 bg-slate-50 rounded-2xl text-sm font-semibold text-slate-600 outline-none border-none"
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
                className="px-4 py-3 bg-slate-50 rounded-2xl text-sm font-semibold text-slate-600 outline-none border-none"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              >
                <option>All Time</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
              </select>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Report Name</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Client</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Period</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Type</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading && reports.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center">
                          <Loader2 className="mx-auto text-indigo-500 animate-spin" size={40} />
                          <p className="mt-4 text-slate-500 font-medium">Loading reports...</p>
                        </td>
                      </tr>
                    ) : filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center">
                          <FileText className="mx-auto text-slate-200" size={60} />
                          <p className="mt-4 text-slate-400 font-bold text-xl">No reports found</p>
                          <p className="text-slate-400">Generate your first report to see it here.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((report) => (
                        <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <FileText size={20} />
                              </div>
                              <div>
                                <div className="font-bold text-slate-800">{report.report_name || report.name}</div>
                                <div className="text-xs text-slate-400">Created {new Date(report.createdAt).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="font-semibold text-slate-700">{report.client_name || 'Direct Workspace'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 w-fit px-3 py-1 rounded-full font-medium">
                              <Calendar size={14} />
                              {report.period}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                               {report.type}
                             </span>
                          </td>
                          <td className="px-6 py-4">
                            {/* FIX 4: Status Badge Logic */}
                            {report.status === 'completed' || report.status === 'READY' ? (
                              <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full w-fit border border-emerald-100">
                                <CheckCircle2 size={16} />
                                Completed
                              </div>
                            ) : report.status === 'failed' ? (
                              <div className="flex items-center gap-1.5 text-rose-600 font-bold text-sm bg-rose-50 px-3 py-1 rounded-full w-fit border border-rose-100">
                                <AlertCircle size={16} />
                                Failed
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-amber-600 font-bold text-sm bg-amber-50 px-3 py-1 rounded-full w-fit border border-amber-100">
                                <Clock size={16} className="animate-pulse" />
                                Pending
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              <button 
                                onClick={() => handleDownload(report)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Download PDF"
                              >
                                <Download size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteReport(report.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white/20"
              >
                <div className="p-8 lg:p-10">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-3xl font-black text-slate-800">Generate New Report</h2>
                      <p className="text-slate-500">Configure report parameters and metrics.</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <X size={24} className="text-slate-400" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateReport} className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Report Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g., Monthly Performance - June 2024"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.report_name}
                        onChange={e => setFormData({...formData, report_name: e.target.value})}
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Client / Workspace</label>
                      <select 
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
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
                        <option value="">Select Client</option>
                        {workspaces.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.companyName || w.name} ({w.workspace_slug || 'Workspace'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Campaign (Optional)</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
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
                        <option value="">All Campaigns</option>
                        {campaigns.filter(c => (c.workspaceId || c.workspace_id) === formData.workspace_id).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Report Type</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData.report_type}
                        onChange={e => setFormData({...formData, report_type: e.target.value})}
                      >
                        <option value="PERFORMANCE">Performance</option>
                        <option value="CAMPAIGN">Campaign Detail</option>
                        <option value="ANALYTICS">Analytics Deep-dive</option>
                        <option value="BUDGET">Budget Allocation</option>
                      </select>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Period</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData.period}
                        onChange={e => setFormData({...formData, period: e.target.value})}
                      >
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                        <option>Last 90 Days</option>
                        <option>This Month</option>
                      </select>
                    </div>

                    <div className="col-span-2 pt-6 flex gap-4">
                      <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
                      >
                        CANCEL
                      </button>
                      <button 
                        type="submit"
                        disabled={creating}
                        className="flex-[2] px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {creating ? <Loader2 className="animate-spin" /> : null}
                        GENERATE REPORT
                      </button>
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
