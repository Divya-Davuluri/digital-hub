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
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const validateForm = () => {
    if (!reportRequest.dateFrom || !reportRequest.dateTo) {
      setStatusMessage({ type: 'error', text: 'Please select both start and end dates.' });
      return false;
    }
    const start = new Date(reportRequest.dateFrom);
    const end = new Date(reportRequest.dateTo);
    if (start > end) {
      setStatusMessage({ type: 'error', text: 'Start date cannot be after end date.' });
      return false;
    }
    return true;
  };

  const handleRequestReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setStatusMessage(null);
    
    try {
      // Dates from <input type="date"> are already YYYY-MM-DD
      console.log('[SUBMITTING_REPORT_REQUEST]', reportRequest);
      
      const res = await apiCall('/api/reports/request', {
        method: 'POST',
        body: JSON.stringify(reportRequest)
      });

      console.log('[REPORT_REQUEST_RESPONSE]', res);

      setStatusMessage({ type: 'success', text: 'Report request submitted successfully! Our team will process it shortly.' });
      
      // Auto-close modal after success
      setTimeout(() => {
        setShowModal(false);
        setStatusMessage(null);
        setReportRequest({
          reportType: 'Performance Summary',
          dateFrom: '',
          dateTo: '',
          notes: ''
        });
        // In a real app, we might refresh the list here
        // fetchReports(); 
      }, 2500);

    } catch (err: any) {
      console.error('[FRONTEND_REPORT_REQUEST_ERROR]', err);
      setStatusMessage({ 
        type: 'error', 
        text: err.message || 'Failed to submit report request. Please try again.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      // Use window.open for now, but in production this might need a more secure download flow
      window.open(`/api/reports/client-pdf?token=${token}`, '_blank');
    } catch (err) {
      console.error('[DOWNLOAD_ERROR]', err);
      alert('Failed to initiate download');
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
              onClick={() => {
                setStatusMessage(null);
                setShowModal(true);
              }}
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
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !submitting && setShowModal(false)} />
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 p-6 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 -mx-6 px-6">
              <h2 className="text-lg font-bold text-slate-900">Request Custom Report</h2>
              <button 
                onClick={() => setShowModal(false)} 
                disabled={submitting}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >&times;</button>
            </div>
            <form className="space-y-4" onSubmit={handleRequestReport}>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Report Type</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={reportRequest.reportType}
                  onChange={(e) => setReportRequest({...reportRequest, reportType: e.target.value})}
                  disabled={submitting}
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
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    value={reportRequest.dateFrom}
                    onChange={(e) => setReportRequest({...reportRequest, dateFrom: e.target.value})}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1">To Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    value={reportRequest.dateTo}
                    onChange={(e) => setReportRequest({...reportRequest, dateTo: e.target.value})}
                    disabled={submitting}
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
                  disabled={submitting}
                />
              </div>
              
              {statusMessage && (
                <div className={`p-4 rounded-xl text-xs font-bold border ${
                  statusMessage.type === 'success' 
                  ? 'bg-green-50 text-green-700 border-green-100' 
                  : 'bg-red-50 text-red-700 border-red-100'
                } animate-pulse`}>
                  {statusMessage.type === 'success' ? '✅ ' : '⚠️ '}
                  {statusMessage.text}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
