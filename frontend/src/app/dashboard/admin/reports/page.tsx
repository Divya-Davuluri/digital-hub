'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";
import { getReportRequests, exportReportPDF, ReportRequest } from "@/services/reportService";
import { getDashboardSummary, DashboardSummary } from "@/services/dashboardService";

export default function AdminReportsPage() {
  const [requests, setRequests] = useState<ReportRequest[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [requestsData, summaryData] = await Promise.all([
          getReportRequests(),
          getDashboardSummary()
        ]);
        setRequests(requestsData);
        setSummary(summaryData);
      } catch (err) {
        console.error("Error fetching report data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportAll = async () => {
    try {
      await exportReportPDF();
    } catch (err) {
      alert("Export failed");
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="admin" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8">
            <div className="mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Agency Reports</h1>
                <p className="text-slate-500">Global performance summaries and client report requests.</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={handleExportAll}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-lg hover:opacity-90 transition-colors"
                >
                  Export Agency PDF
                </button>
              </div>
            </div>

            {/* Global Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <SummaryCard label="Total Spend" value={`$${summary?.totalSpend.toLocaleString()}`} />
              <SummaryCard label="Total Conversions" value={summary?.totalConversions.toLocaleString()} />
              <SummaryCard label="Avg. ROAS" value={`${summary?.avgRoas.toFixed(2)}x`} />
              <SummaryCard label="Report Requests" value={requests.length.toString()} />
            </div>

            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">Recent Client Report Requests</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-y border-slate-100">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Report Type</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requested Date</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">Syncing report requests...</td>
                      </tr>
                    ) : requests.length > 0 ? (
                      requests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-900">{req.clientName || 'Standard Client'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{req.reportType}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                              req.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-primary font-bold text-xs uppercase hover:underline">Process</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No pending report requests.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

function SummaryCard({ label, value }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h2 className="text-2xl font-bold text-slate-900">{value || '0'}</h2>
    </div>
  );
}
