'use client';

import { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import Header from "@/components/Header";
import apiCall from "@/lib/api";

export default function ClientReportsPage() {
  const [reports, setReports] = useState<any[]>([
    { id: 1, name: 'Monthly Performance - April 2026', date: '2026-05-01', size: '2.4 MB', status: 'ready' },
    { id: 2, name: 'Quarterly Review Q1', date: '2026-04-05', size: '5.1 MB', status: 'ready' },
    { id: 3, name: 'Ad Spend Breakdown', date: '2026-03-28', size: '1.2 MB', status: 'ready' },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [reportRequest, setReportRequest] = useState({
    reportType: 'Performance Summary',
    dateFrom: '',
    dateTo: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleRequestReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await apiCall('/api/reports/request', {
        method: 'POST',
        body: JSON.stringify(reportRequest)
      });
      setMessage('Request submitted successfully!');
      setTimeout(() => {
        setShowModal(false);
        setMessage('');
      }, 2000);
    } catch (err: any) {
      setMessage(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async () => {
    try {
      window.open('/api/reports/client-pdf', '_blank');
    } catch (err) {
      alert('Failed to download report');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="client" />
      <div className="flex-1 ml-[260px] flex flex-col">
        <Header />
        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Campaign Reports</h1>
              <p className="text-sm text-slate-500 mt-1">Download and analyze your agency performance reports.</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors"
            >
              Request Custom Report
            </button>
          </div>

          <div className="grid gap-6">
            {reports.map((report) => (
              <div key={report.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center text-xl font-bold">
                    PDF
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{report.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">Generated on {report.date} • {report.size}</p>
                  </div>
                </div>
                <button 
                  onClick={handleDownload}
                  className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 p-6 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 -mx-6 px-6">
              <h2 className="text-lg font-bold text-slate-900">Request Custom Report</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <form className="space-y-4" onSubmit={handleRequestReport}>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Report Type</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={reportRequest.reportType}
                  onChange={(e) => setReportRequest({...reportRequest, reportType: e.target.value})}
                >
                  <option>Performance Summary</option>
                  <option>Ad Spend Breakdown</option>
                  <option>Conversion Tracking</option>
                  <option>Competitor Analysis</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">From Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    value={reportRequest.dateFrom}
                    onChange={(e) => setReportRequest({...reportRequest, dateFrom: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">To Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    value={reportRequest.dateTo}
                    onChange={(e) => setReportRequest({...reportRequest, dateTo: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Notes / Special Instructions</label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  placeholder="e.g. Please include Facebook Ad metrics specifically."
                  value={reportRequest.notes}
                  onChange={(e) => setReportRequest({...reportRequest, notes: e.target.value})}
                />
              </div>
              
              {message && (
                <div className={`p-3 rounded-lg text-sm font-bold ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message}
                </div>
              )}

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-4 shadow-lg shadow-indigo-100"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
