'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { apiCall } from '@/lib/api';
import { 
  FileText, Download, Filter, Search, 
  Calendar, CheckCircle2, Clock, AlertCircle,
  MoreVertical, ExternalLink, Plus, X, Trash2
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
    report_type: 'PERFORMANCE',
    period: 'Last 30 Days',
    workspace_id: '',
    client_id: '',
    campaign_id: '',
    start_date: '',
    end_date: ''
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
      console.log("[DEBUG] Fetching reports with filters:", { typeFilter, dateFilter });
      const response = await apiCall(`/reports?type=${typeFilter}&period=${dateFilter}`);
      console.log("[DEBUG] Reports response:", response);
      
      const reportList = response.reports || (Array.isArray(response) ? response : []);
      setReports(reportList);
    } catch (err) {
      console.error("[DEBUG] Failed to load reports", err);
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
    if (!formData.report_name || !formData.workspace_id) {
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
        toast.success("Report generated successfully");
        setIsModalOpen(false);
        
        // Reset filters to ensure the new report is visible
        const filtersWereDefault = typeFilter === 'All Types' && dateFilter === 'Last 30 Days' && searchTerm === '';
        
        setTypeFilter('All Types');
        setDateFilter('Last 30 Days');
        setSearchTerm('');
        
        // If filters were already default, useEffect won't trigger, so fetch manually
        if (filtersWereDefault) {
          fetchReports();
        }
        
        setFormData({
          report_name: '', report_type: 'PERFORMANCE', period: 'Last 30 Days',
          workspace_id: '', client_id: '', campaign_id: '', start_date: '', end_date: ''
        });
      } else {
        toast.error(res.error || "Failed to generate report");
      }
    } catch (err: any) {
      console.error("[DEBUG] Create report error:", err);
      toast.error(err.message || "Failed to generate report");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    try {
      await apiCall(`/reports/${id}`, { method: 'DELETE' });
      toast.success("Report deleted");
      setReports(reports.filter(r => r.id !== id));
    } catch (err) {
      toast.error("Failed to delete report");
    }
  };

  const handleDownload = async (report: any) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://digital-hub-1.onrender.com'}/api/reports/${report.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${report.name.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed to download report");
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter(r => 
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.workspaceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reports, searchTerm]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-[260px]">
        <Header />
        <main className="p-8 max-w-[1400px] mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Performance Reports</h1>
              <p className="text-slate-500 mt-1">Access and manage all generated campaign reports and analytics.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <Plus size={18} /> Request New Report
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search reports by name or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option>All Types</option>
                <option>Performance</option>
                <option>Campaign</option>
                <option>Analytics</option>
                <option>Budget</option>
                <option>Client Summary</option>
              </select>
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>This Month</option>
              </select>
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client / Workspace</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
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
                ) : filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={18} /></div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{report.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Created {new Date(report.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-bold text-slate-700">{report.workspaceName || 'Global'}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-black">{report.clientName}</div>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500 font-medium">{report.period}</td>
                      <td className="px-6 py-5">
                        <span className="text-[10px] font-black uppercase px-2 py-1 bg-slate-100 rounded-md text-slate-500 tracking-tighter">
                          {report.type}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          report.status === 'READY' ? 'bg-green-50 text-green-600 border border-green-100' : 
                          'bg-slate-50 text-slate-500 border border-slate-100'
                        }`}>
                          {report.status === 'READY' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleDownload(report)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Download PDF"
                          >
                            <Download size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(report.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-24 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner border border-slate-100">📊</div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">No reports found</h3>
                      <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
                        No performance reports matched your current filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Create Report Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Generate New Report</h3>
                  <p className="text-sm text-slate-500">Configure report parameters and metrics.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-900">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateReport} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
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

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Client / Workspace</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.workspace_id}
                      onChange={e => {
                        const ws = workspaces.find(w => (w.workspaceId || w.workspace_id) === e.target.value);
                        setFormData({
                          ...formData, 
                          workspace_id: e.target.value, 
                          client_id: ws?.id || ws?.clientId || ''
                        });
                      }}
                    >
                      <option value="">Select Workspace</option>
                      {workspaces.map(w => (
                        <option key={w.id} value={w.workspaceId || w.workspace_id}>
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
                      onChange={e => setFormData({...formData, campaign_id: e.target.value})}
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

                  <div className="space-y-2">
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
                </div>

                <div className="pt-6 border-t border-slate-100 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 px-6 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={creating}
                    className="flex-[2] py-4 px-6 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {creating ? 'Generating...' : 'Generate Report'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
