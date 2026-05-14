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
  ChevronRight, LayoutGrid, Check
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

  // FIX 4: CSV Download (Option B)
  const handleDownload = (report: any) => {
    const rows = [
      ['FIELD', 'VALUE'],
      ['Report Name', report.report_name || report.name],
      ['Client', report.clientName || report.client_name || 'N/A'],
      ['Period', report.period || 'Last 30 Days'],
      ['Type', report.type],
      ['Status', report.status],
      ['Total Spend', `$${(report.totalSpend || 0).toLocaleString()}`],
      ['Impressions', (report.impressions || 0).toLocaleString()],
      ['Clicks', (report.clicks || 0).toLocaleString()],
      ['Conversions', (report.conversions || 0).toLocaleString()],
      ['ROAS', (report.roas || 0).toFixed(2)],
      ['Generated At', new Date(report.createdAt).toLocaleString()],
    ];
    
    const csvContent = rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${(report.report_name || 'report').replace(/\s+/g, '_')}_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV Exported successfully");
  };

  const filteredReports = reports.filter(r => 
    (r.report_name || r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.clientName || r.client_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pl-[260px]">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1400px] mx-auto space-y-8">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Marketing Reports</h1>
                <p className="text-gray-500 text-sm mt-1">Manage, analyze and export performance reports for all clients.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold shadow-sm hover:bg-blue-700 transition-all active:scale-95 text-sm"
              >
                <Plus size={18} />
                Generate New Report
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search reports..."
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none border-none transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <select 
                  className="px-4 py-2.5 bg-gray-50 rounded-lg text-sm font-medium text-gray-600 outline-none border-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                  className="px-4 py-2.5 bg-gray-50 rounded-lg text-sm font-medium text-gray-600 outline-none border-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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

            {/* Professional Table (FIX 1, 5) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="w-[5%] px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">#</th>
                      <th className="w-[25%] px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Report Name</th>
                      <th className="w-[20%] px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="w-[15%] px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Period</th>
                      <th className="w-[10%] px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="w-[10%] px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="w-[15%] px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading && reports.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-24 text-center">
                          <Loader2 className="mx-auto text-blue-500 animate-spin" size={32} />
                          <p className="mt-3 text-gray-400 font-medium text-sm">Fetching report data...</p>
                        </td>
                      </tr>
                    ) : filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-24 text-center">
                          <div className="max-w-sm mx-auto">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                              <LayoutGrid size={32} />
                            </div>
                            <h3 className="mt-4 text-lg font-bold text-gray-900">No reports yet</h3>
                            <p className="mt-1 text-gray-500 text-sm">Generate your first report to see performance insights here.</p>
                            <button 
                              onClick={() => setIsModalOpen(true)}
                              className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all"
                            >
                              <Plus size={16} />
                              Generate Report
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((report, idx) => (
                        <tr key={report.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-6 py-5 text-center text-xs font-bold text-gray-400">{idx + 1}</td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900 text-sm">{report.report_name || report.name}</span>
                              <span className="text-[11px] text-gray-400 font-medium mt-0.5">Created {new Date(report.createdAt).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            {/* FIX 2: Show real client name */}
                            <span className="text-gray-700 text-sm font-medium">
                              {report.clientName || report.client_name || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                              <Calendar size={14} className="text-gray-400" />
                              {/* FIX 3: Fallback period */}
                              {report.period || 'Last 30 Days'}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                             <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-600 uppercase tracking-wide border border-purple-100">
                               {report.type || 'PERFORMANCE'}
                             </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-tight">
                              <Check size={12} strokeWidth={3} />
                              Completed
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end items-center gap-2">
                              <button 
                                onClick={() => handleDownload(report)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg transition-all text-xs font-bold"
                              >
                                <Download size={14} />
                                CSV
                              </button>
                              <button 
                                onClick={() => handleDeleteReport(report.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all"
                              >
                                <Trash2 size={16} />
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Generate Report</h2>
                      <p className="text-gray-500 text-sm mt-1">Select parameters for your campaign analysis.</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <X size={20} className="text-gray-400" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateReport} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Report Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Monthly Strategy Review"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={formData.report_name}
                        onChange={e => setFormData({...formData, report_name: e.target.value})}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Target Client</label>
                      <select 
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
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
                        <option value="">Select a client...</option>
                        {workspaces.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.companyName || w.name} ({w.workspace_slug || 'SaaS'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Report Type</label>
                        <select 
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                          value={formData.report_type}
                          onChange={e => setFormData({...formData, report_type: e.target.value})}
                        >
                          <option value="PERFORMANCE">Performance</option>
                          <option value="ANALYTICS">Analytics</option>
                          <option value="CAMPAIGN">Campaign</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Period</label>
                        <select 
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
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

                    <div className="pt-6 flex gap-3">
                      <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 px-6 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={creating}
                        className="flex-[2] px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {creating ? <Loader2 className="animate-spin" size={18} /> : null}
                        Generate Report
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
