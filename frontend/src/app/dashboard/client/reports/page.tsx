'use client';

import { useState } from "react";
import Sidebar from "../Sidebar";
import Header from "@/components/Header";

export default function ClientReportsPage() {
  const reports = [
    { id: 1, name: 'Monthly Performance - April 2026', date: '2026-05-01', size: '2.4 MB', status: 'ready' },
    { id: 2, name: 'Quarterly Review Q1', date: '2026-04-05', size: '5.1 MB', status: 'ready' },
    { id: 3, name: 'Ad Spend Breakdown', date: '2026-03-28', size: '1.2 MB', status: 'ready' },
  ];

  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [reportType, setReportType] = useState('Campaign Performance');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDownload = async (reportId: string, reportName: string) => {
    try {
      setDownloadingId(Number(reportId));
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://digital-hub-3h88.onrender.com';
      const base = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

      const response = await fetch(
        `${base}/client/reports/${reportId}/download`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      alert('Download failed. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRequestReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://digital-hub-3h88.onrender.com';
      const base = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

      const response = await fetch(`${base}/client/reports/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reportType, dateFrom, dateTo, notes })
      });

      if (!response.ok) throw new Error('Failed to request report');

      alert('Report request submitted! Your agency will generate it within 24 hours.');
      setShowModal(false);
      // Reset form
      setReportType('Campaign Performance');
      setDateFrom('');
      setDateTo('');
      setNotes('');
    } catch (err) {
      alert('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
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
              className="btn-primary !py-2.5 !px-6 text-xs font-bold shadow-lg shadow-indigo-100"
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
                  onClick={() => handleDownload(String(report.id), report.name)}
                  disabled={downloadingId === report.id}
                  className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline disabled:opacity-50"
                >
                  {downloadingId === report.id ? 'Downloading...' : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Download
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-[500px] max-w-[90vw] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Request Custom Report</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleRequestReport} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Report Type</label>
                <select 
                  className="input-field" 
                  value={reportType} 
                  onChange={e => setReportType(e.target.value)}
                  required
                >
                  <option>Campaign Performance</option>
                  <option>Ad Spend Analysis</option>
                  <option>Conversion Tracking</option>
                  <option>ROI Summary</option>
                  <option>Custom Date Range</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Date From</label>
                  <input type="date" className="input-field" value={dateFrom} onChange={e => setDateFrom(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Date To</label>
                  <input type="date" className="input-field" value={dateTo} onChange={e => setDateTo(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Additional Notes (Optional)</label>
                <textarea 
                  className="input-field min-h-[100px]" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)}
                  placeholder="E.g., Please break down by individual ad groups."
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 mr-2">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
