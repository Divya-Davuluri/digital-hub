'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { apiCall } from '@/lib/api';
import { 
  FileText, Download, Filter, Search, 
  Calendar, CheckCircle2, Clock, AlertCircle,
  MoreVertical, ExternalLink, Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function UnifiedReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await apiCall('/reports');
        setReports(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load reports", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const filteredReports = reports.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.workspaceName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
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
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all">
                <Filter size={16} /> All Types
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all">
                <Calendar size={16} /> Last 30 Days
              </button>
            </div>
          </div>

          {/* Reports List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client / Workspace</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-slate-100 rounded w-full" /></td>
                    </tr>
                  ))
                ) : filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={18} /></div>
                          <span className="text-sm font-bold text-slate-900">{report.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500 font-medium">{report.workspaceName || 'Global'}</td>
                      <td className="px-6 py-5 text-sm text-slate-500 font-medium">{report.period || 'Monthly'}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          report.status === 'READY' ? 'bg-green-50 text-green-600 border border-green-100' : 
                          report.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          'bg-slate-50 text-slate-500 border border-slate-100'
                        }`}>
                          {report.status === 'READY' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Download size={16} /></button>
                          <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"><MoreVertical size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-24 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner border border-slate-100">
                        📊
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">No reports found</h3>
                      <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
                        You haven't generated any performance reports yet. Start by requesting a new report for a client.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
