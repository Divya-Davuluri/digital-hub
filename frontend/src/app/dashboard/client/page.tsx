'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import apiCall from "@/lib/api";
import RoleGuard from "@/components/RoleGuard";

export default function ClientDashboard() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const data = await apiCall("/agency/campaigns");
        setCampaigns(Array.isArray(data) ? data : (data.campaigns || []));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const handleDownloadPDF = () => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html><head>
          <title>Agency Performance Report</title>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            h1 { color: #4f46e5; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
            .stat { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .stat-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; }
            .stat-value { font-size: 20px; font-weight: bold; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; padding: 12px; background: #f8fafc; border-bottom: 2px solid #eee; font-size: 12px; color: #64748b; }
            td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
            .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <h1>Performance Overview</h1>
          <p>Generated: ${new Date().toLocaleDateString()}</p>
          
          <div class="grid">
            <div class="stat"><div class="stat-label">Total Spend</div><div class="stat-value">$4,500</div></div>
            <div class="stat"><div class="stat-label">Impressions</div><div class="stat-value">1.2M</div></div>
            <div class="stat"><div class="stat-label">Clicks</div><div class="stat-value">24.5K</div></div>
            <div class="stat"><div class="stat-label">Conversions</div><div class="stat-value">482</div></div>
          </div>

          <h3>Active Campaigns</h3>
          <table>
            <thead>
              <tr><th>Campaign Name</th><th>Budget</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${Array.isArray(campaigns) ? campaigns.map(c => `
                <tr>
                  <td>${c.name}</td>
                  <td>$${c.budget}</td>
                  <td>${c.status.toUpperCase()}</td>
                </tr>
              `).join('') : ''}
            </tbody>
          </table>
          
          <div class="footer">Digital Marketing Hub - Confidential Performance Report</div>
        </body></html>
      `);
      win.document.close();
      win.print();
    }
  };

  const handleViewBreakdown = (campaign: any) => {
    alert(`Showing detailed breakdown for ${campaign.name}\n\nBudget: $${campaign.budget}\nStatus: ${campaign.status}\nPlatform: Google Ads\n\nDetailed analytics are being synchronized...`);
  };

  return (
    <RoleGuard allowedRoles={['client', 'admin']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="client" />
        <div className="flex-1 ml-[260px] flex flex-col">
          <Header />
          <main className="p-8 max-w-7xl mx-auto w-full">
            <div className="mb-10 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Campaign Report</h1>
                <p className="text-sm text-slate-500 mt-1">View live performance metrics and download your agency reports.</p>
              </div>
              <button 
                onClick={handleDownloadPDF}
                className="btn-primary !py-2 !px-4 text-xs font-bold"
              >
                Download PDF Report
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <StatCard label="Total Spend" value="$4,500" icon="💸" />
              <StatCard label="Impressions" value="1.2M" icon="👀" />
              <StatCard label="Clicks" value="24.5K" icon="🖱️" />
              <StatCard label="Conversions" value="482" icon="🎯" />
            </div>

            <div className="card">
               <h3 className="text-base font-bold mb-6">Active Campaigns</h3>
               {loading ? (
                  <div className="text-slate-400 text-sm italic">Synchronizing live data...</div>
               ) : Array.isArray(campaigns) && campaigns.length > 0 ? (
                  <div className="space-y-4">
                    {campaigns.map((c, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                         <div>
                            <p className="font-bold text-slate-900">{c.name}</p>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">{c.status}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-sm font-bold text-indigo-600">Budget: ${c.budget}</p>
                            <button 
                              onClick={() => handleViewBreakdown(c)}
                              className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest mt-1"
                            >
                              View Breakdown
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
               ) : (
                  <div className="py-12 text-center">
                     <p className="text-slate-400 text-sm">No campaigns currently active for your account.</p>
                  </div>
               )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

function StatCard({ label, value, icon }: any) {
  return (
    <div className="card bg-white border-slate-100">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <h2 className="text-2xl font-bold text-slate-900">{value}</h2>
    </div>
  );
}
