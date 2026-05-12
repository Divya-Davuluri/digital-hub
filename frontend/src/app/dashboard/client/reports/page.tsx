'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";
import { getReportRequests, requestCustomReport, exportReportPDF, ReportRequest, getReports, downloadReport } from "@/services/reportService";
import { useAuth } from "@/context/AuthContext";

export default function ClientReportsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ReportRequest[]>([]);
  const [generatedReports, setGeneratedReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [reqData, reportData] = await Promise.all([
        getReportRequests(user?.workspaceId || undefined),
        getReports(user?.workspaceId || undefined)
      ]);
      setRequests(reqData);
      setGeneratedReports(reportData);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleRequestReport = async () => {
    setSubmitting(true);
    try {
      const res = await requestCustomReport({
        reportType: 'MONTHLY_PERFORMANCE',
        workspaceId: user?.workspaceId
      });
      
      if (res && res.success === false) {
        alert(`Failed to request report: ${res.error || res.message || 'Unknown error'}`);
        return;
      }
      
      alert("Report request submitted!");
      fetchData();
    } catch (err) {
      alert("Failed to request report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadLatest = async () => {
    try {
      await exportReportPDF(user?.workspaceId || undefined);
    } catch (err) {
      alert("Download failed");
    }
  };

  const handleDownloadReport = async (url: string) => {
    try {
      await downloadReport(url);
    } catch (err) {
      alert("Download failed");
    }
  };

  return (
    <RoleGuard allowedRoles={['client', 'admin']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="client" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8 max-w-6xl mx-auto w-full">
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Your Reports</h1>
                <p className="text-slate-500">Access performance archives and request custom summaries.</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={handleDownloadLatest}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors"
                >
                  Download Latest PDF
                </button>
                <button 
                  onClick={handleRequestReport}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Requesting...' : 'Request New Report'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div className="card">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Archive Vault</h3>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8 text-slate-400 italic">Syncing your secure report vault...</div>
                  ) : Array.isArray(generatedReports) && generatedReports.length > 0 ? (
                    generatedReports.map((report) => (
                      <div key={report.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex justify-between items-center group hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl">
                            📊
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{report.name || 'Untitled Report'}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                              Generated {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDownloadReport(report.url)}
                          className="px-4 py-2 bg-slate-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          Download PDF
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-slate-400 text-sm">No generated reports available yet.</p>
                  )}
                </div>
              </div>

              <div className="card border-dashed border-2">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Requests</h3>
                <div className="space-y-4">
                  {Array.isArray(requests) && requests.map((req) => (
                    <div key={req.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl border border-slate-100">
                          📩
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{(req.reportType || 'Custom Report').replace('_', ' ')}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            Requested {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                         req.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                       }`}>
                        {req.status || 'PENDING'}
                      </div>
                    </div>
                  ))}
                  {(!Array.isArray(requests) || requests.length === 0) && !loading && (
                    <p className="text-center py-8 text-slate-400 text-sm italic">No recent requests found.</p>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
