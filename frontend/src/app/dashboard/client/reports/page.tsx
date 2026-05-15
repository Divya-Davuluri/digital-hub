'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";
import apiCall from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { generatePDFReport } from "@/lib/exportUtils";
import { useBranding } from "@/context/BrandingContext";
import { Download, Loader2, FileText, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ClientReportsPage() {
  const { user } = useAuth();
  const { branding } = useBranding();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

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

  const handleDownloadPDF = async (campaign: any) => {
    setDownloading(campaign.id);
    try {
      await generatePDFReport({
        title: `Performance Report: ${campaign.name}`,
        clientName: user?.name || 'Valued Client',
        period: '30',
        metrics: {
          totalSpend: campaign.spent,
          totalRevenue: Number(campaign.conversions || 0) * 150, // Fallback revenue
          totalClicks: campaign.clicks,
          totalImpressions: campaign.impressions,
          totalConversions: campaign.conversions,
          avgROAS: campaign.spent > 0 ? (campaign.conversions * 150 / campaign.spent).toFixed(1) : '0.0'
        },
        campaigns: [campaign],
        channels: [{ channel: campaign.platform || 'Other', spent: campaign.spent, conversions: campaign.conversions }],
        branding: {
          agencyName: branding?.agencyName,
          primaryColor: branding?.primaryColor,
          logoUrl: branding?.logoUrl
        }
      });
      toast.success("PDF Downloaded successfully");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(null);
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
    toast.success("CSV Exported successfully");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar role="client" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <div className="p-8 text-center py-24 text-slate-400 italic flex flex-col items-center gap-4">
             <Loader2 className="animate-spin text-indigo-600" size={32} />
             Generating reports...
          </div>
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
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Performance Archives</h1>
                <p className="text-slate-500 mt-1">Comprehensive campaign audit logs and professional exports.</p>
              </div>
              <button 
                onClick={exportAllCSV}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg"
              >
                <Download size={16} /> Export All (CSV)
              </button>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <ReportMetric label="Total Campaigns" value={data?.summary?.totalCampaigns || 0} icon={<FileText size={16} />} />
              <ReportMetric label="Total Budget" value={`$${(data?.summary?.totalBudget || 0).toLocaleString()}`} icon={<CheckCircle2 size={16} />} />
              <ReportMetric label="Total Spent" value={`$${(data?.summary?.totalSpent || 0).toLocaleString()}`} icon={<Loader2 size={16} />} />
              <ReportMetric label="Avg. ROAS" value={`${data?.summary?.roas || '0.00'}x`} color="text-indigo-600" icon={<CheckCircle2 size={16} />} />
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
                        <th className="px-6 py-4 text-right">Download</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {data?.campaigns?.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-all">
                           <td className="px-6 py-4 font-bold text-slate-900 text-sm">{c.name}</td>
                           <td className="px-6 py-4">
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded uppercase">
                                {c.platform || 'Google'}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-sm text-slate-600 font-medium">${Number(c.budget).toLocaleString()}</td>
                           <td className="px-6 py-4 text-sm font-bold text-slate-900">${Number(c.spent).toLocaleString()}</td>
                           <td className="px-6 py-4 text-sm text-slate-500 font-medium">{Number(c.impressions).toLocaleString()}</td>
                           <td className="px-6 py-4 text-sm text-slate-500 font-medium">{Number(c.clicks).toLocaleString()}</td>
                           <td className="px-6 py-4 text-sm text-slate-500 font-medium">{Number(c.conversions).toLocaleString()}</td>
                           <td className="px-6 py-4 text-right">
                              <button 
                                 onClick={() => handleDownloadPDF(c)}
                                 disabled={downloading === c.id}
                                 className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-lg transition-all text-xs font-bold disabled:opacity-50"
                              >
                                 {downloading === c.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                 PDF
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

function ReportMetric({ label, value, color = "text-slate-900", icon }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-all">
      <div className="flex justify-between items-center mb-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <div className="text-slate-300">{icon}</div>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}
