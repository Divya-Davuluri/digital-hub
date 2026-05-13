'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";
import apiCall from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function ClientReportsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await apiCall('/client/reports');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchReports();
  }, [user]);

  const downloadCampaignPDF = (campaign: any) => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html><head>
          <title>Report - ${campaign.name}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; }
            h1 { color: #4f46e5; border-bottom: 2px solid #f3f4f6; padding-bottom: 15px; margin-bottom: 30px; }
            .section { margin-bottom: 30px; }
            .label { font-size: 12px; font-weight: bold; color: #6b7280; text-transform: uppercase; margin-bottom: 5px; }
            .value { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
            .box { background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <h1>Performance Audit: ${campaign.name}</h1>
          <div class="section">
            <div class="label">Date Range</div>
            <div class="value">${new Date(campaign.start_date || Date.now()).toLocaleDateString()} - ${new Date(campaign.end_date || Date.now()).toLocaleDateString()}</div>
          </div>
          <div class="grid">
            <div class="box"><div class="label">Total Impressions</div><div class="value">${Number(campaign.impressions).toLocaleString()}</div></div>
            <div class="box"><div class="label">Total Clicks</div><div class="value">${Number(campaign.clicks).toLocaleString()}</div></div>
            <div class="box"><div class="label">Conversions</div><div class="value">${Number(campaign.conversions).toLocaleString()}</div></div>
            <div class="box"><div class="label">Budget Allocation</div><div class="value">$${Number(campaign.budget).toLocaleString()}</div></div>
            <div class="box"><div class="label">Actual Spend</div><div class="value">$${Number(campaign.spent).toLocaleString()}</div></div>
            <div class="box"><div class="label">CTR</div><div class="value">${campaign.impressions > 0 ? ((campaign.clicks/campaign.impressions)*100).toFixed(2) : 0}%</div></div>
          </div>
        </body></html>
      `);
      win.document.close();
      win.print();
    }
  };

  const exportAllCSV = () => {
    if (!data?.campaigns) return;
    const headers = ['Campaign', 'Platform', 'Budget', 'Spent', 'Impressions', 'Clicks', 'Conversions'];
    const rows = data.campaigns.map((c: any) => [
      c.name, c.platform, c.budget, c.spent, c.impressions, c.clicks, c.conversions
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map((e: any) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `all_campaigns_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar role="client" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <div className="p-8 text-center py-24 text-slate-400 italic">Generating reports...</div>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['client', 'admin']}>
      <div className="flex min-h-screen bg-white">
        <Sidebar role="client" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8 max-w-7xl mx-auto w-full">
            <div className="mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Performance Archives</h1>
                <p className="text-slate-500">Comprehensive campaign audit logs and exports.</p>
              </div>
              <button 
                onClick={exportAllCSV}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <span>📥</span> Export All (CSV)
              </button>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <ReportMetric label="Total Campaigns" value={data?.summary?.totalCampaigns || 0} />
              <ReportMetric label="Total Budget" value={`$${(data?.summary?.totalBudget || 0).toLocaleString()}`} />
              <ReportMetric label="Total Spent" value={`$${(data?.summary?.totalSpent || 0).toLocaleString()}`} />
              <ReportMetric label="Avg. ROAS" value={`${data?.summary?.roas || '0.00'}x`} color="text-indigo-600" />
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="px-6 py-4">Campaign</th>
                        <th className="px-6 py-4">Platform</th>
                        <th className="px-6 py-4">Budget</th>
                        <th className="px-6 py-4">Spent</th>
                        <th className="px-6 py-4">Impr.</th>
                        <th className="px-6 py-4">Clicks</th>
                        <th className="px-6 py-4">Conv.</th>
                        <th className="px-6 py-4">CTR</th>
                        <th className="px-6 py-4">Download</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {data?.campaigns?.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-all">
                           <td className="px-6 py-4 font-bold text-slate-900 text-sm">{c.name}</td>
                           <td className="px-6 py-4 text-[10px] font-black text-indigo-500 uppercase">{c.platform || 'Google'}</td>
                           <td className="px-6 py-4 text-sm text-slate-600">${Number(c.budget).toLocaleString()}</td>
                           <td className="px-6 py-4 text-sm font-bold text-slate-900">${Number(c.spent).toLocaleString()}</td>
                           <td className="px-6 py-4 text-sm text-slate-600">{Number(c.impressions).toLocaleString()}</td>
                           <td className="px-6 py-4 text-sm text-slate-600">{Number(c.clicks).toLocaleString()}</td>
                           <td className="px-6 py-4 text-sm text-slate-600">{Number(c.conversions).toLocaleString()}</td>
                           <td className="px-6 py-4 text-sm font-bold text-indigo-600">
                              {c.impressions > 0 ? ((c.clicks/c.impressions)*100).toFixed(2) : 0}%
                           </td>
                           <td className="px-6 py-4">
                              <button 
                                 onClick={() => downloadCampaignPDF(c)}
                                 className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-all"
                                 title="Download PDF"
                              >
                                 📄
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

function ReportMetric({ label, value, color = "text-slate-900" }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}
