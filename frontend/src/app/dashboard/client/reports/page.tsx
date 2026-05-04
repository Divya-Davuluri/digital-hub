'use client';

import Sidebar from "../Sidebar";
import Header from "@/components/Header";

export default function ClientReportsPage() {
  const reports = [
    { id: 1, name: 'Monthly Performance - April 2026', date: '2026-05-01', size: '2.4 MB', status: 'ready' },
    { id: 2, name: 'Quarterly Review Q1', date: '2026-04-05', size: '5.1 MB', status: 'ready' },
    { id: 3, name: 'Ad Spend Breakdown', date: '2026-03-28', size: '1.2 MB', status: 'ready' },
  ];

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
            <button className="btn-primary !py-2.5 !px-6 text-xs font-bold shadow-lg shadow-indigo-100">
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
                <button className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
