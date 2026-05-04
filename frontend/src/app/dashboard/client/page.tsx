'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";

export default function ClientDashboard() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const data = await apiFetch("/agency/campaigns");
        setCampaigns(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        '/api/client/report/pdf',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `campaign-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('PDF download failed. Please try again.');
    } finally {
      setDownloading(false);
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
              <h1 className="text-2xl font-bold text-slate-900">Campaign Report</h1>
              <p className="text-sm text-slate-500 mt-1">View live performance metrics and download your agency reports.</p>
            </div>
            <button 
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="btn-primary !py-2 !px-4 text-xs font-bold disabled:opacity-50"
            >
              {downloading ? 'Generating PDF...' : 'Download PDF Report'}
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
             ) : campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.map((c, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                       <div>
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">{c.status}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-bold text-indigo-600">Budget: ${c.budget}</p>
                          <button className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest mt-1">View Breakdown</button>
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
