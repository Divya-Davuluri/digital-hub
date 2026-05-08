'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";
import { getReportRequests, requestCustomReport, exportReportPDF, ReportRequest } from "@/services/reportService";
import { useAuth } from "@/context/AuthContext";

export default function ClientReportsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ReportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchMyReports = async () => {
      try {
        const data = await getReportRequests(user?.workspaceId || undefined);
        setRequests(data);
      } catch (err) {
        console.error("Error fetching reports:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchMyReports();
  }, [user]);

  const handleRequestReport = async () => {
    setSubmitting(true);
    try {
      await requestCustomReport({
        reportType: 'MONTHLY_PERFORMANCE',
        workspaceId: user?.workspaceId
      });
      alert("Report request submitted!");
      // Refresh list
      const data = await getReportRequests(user?.workspaceId || undefined);
      setRequests(data);
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

            <div className="grid grid-cols-1 gap-6">
              <div className="card">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Report History</h3>
                
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8 text-slate-400 italic">Syncing your secure report vault...</div>
                  ) : requests.length > 0 ? (
                    requests.map((req) => (
                      <div key={req.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-slate-100">
                            📄
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{req.reportType.replace('_', ' ')}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Requested {new Date(req.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                             <p className={`text-[10px] font-black uppercase tracking-widest ${
                               req.status === 'COMPLETED' ? 'text-green-500' : 'text-amber-500'
                             }`}>{req.status}</p>
                             {req.status === 'COMPLETED' && <button className="text-xs font-bold text-indigo-600 hover:underline">Download PDF</button>}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-slate-400 text-sm italic">No custom report requests yet.</p>
                    </div>
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
