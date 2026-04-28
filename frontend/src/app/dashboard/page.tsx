'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";

interface DashboardData {
  totalCampaigns: number;
  activeUsers: number;
  revenue: number;
  performance: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Feature states
  const [isExporting, setIsExporting] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token) {
      router.push("/login");
      return;
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const fetchDashboard = async () => {
      try {
        const dashboardData = await apiFetch("/dashboard");
        setData(dashboardData);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setShowToast({ show: true, message, type });
    setTimeout(() => setShowToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      triggerToast("Performance report successfully generated and sent to your email!");
    }, 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium text-sm">Loading your workspace...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 ml-[260px] min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 p-8 max-w-7xl mx-auto w-full animate-subtle-fade">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Good morning, {user?.name?.split(' ')[0] || 'Partner'}!</h1>
              <p className="text-sm text-slate-500 mt-1">Here is a summary of your agency's performance today.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="btn-secondary text-sm !px-4 !py-2"
              >
                {isExporting ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Export PDF
                  </>
                )}
              </button>
              <button
                onClick={() => setShowCampaignModal(true)}
                className="btn-primary text-sm !px-4 !py-2"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Create Campaign
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Total Campaigns"
              value={data?.totalCampaigns || 0}
              trend="+2.5%"
              trendType="up"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
            />
            <StatCard
              label="Active Audience"
              value={data?.activeUsers || 0}
              trend="+5.4%"
              trendType="up"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            />
            <StatCard
              label="Monthly Revenue"
              value={`$${(data?.revenue || 0).toLocaleString()}`}
              trend="+18%"
              trendType="up"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard
              label="Performance Index"
              value={`${data?.performance || 0}%`}
              trend="-1.2%"
              trendType="down"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="card !p-0 overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <h3 className="text-base font-bold">Performance Overview</h3>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-primary"></span> Revenue
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 ml-4">
                      <span className="w-2 h-2 rounded-full bg-slate-200"></span> Projections
                    </span>
                  </div>
                </div>
                <div className="h-[320px] w-full bg-slate-50/50 flex items-center justify-center relative group">
                  <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                  <div className="relative text-center">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-border flex items-center justify-center text-primary mb-4 mx-auto group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Campaign Analytics Graph</p>
                    <p className="text-xs text-slate-500 mt-1">Real-time data visualization placeholder</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50/50 border-t border-border flex justify-center">
                  <button onClick={() => triggerToast("Navigating to detailed reports...")} className="text-xs font-bold text-primary hover:underline">View Detailed Report →</button>
                </div>
              </div>

              <div className="card !p-0 overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <h3 className="text-base font-bold">Active Campaigns</h3>
                  <button onClick={() => router.push('/projects')} className="text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wider">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Campaign</th>
                        <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Budget</th>
                        <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Performance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[
                        { name: 'Nike Summer Blitz', budget: '$12,400', status: 'Active', perf: '84%', color: 'bg-indigo-500' },
                        { name: 'Tesla FSD Launch', budget: '$45,000', status: 'In Review', perf: 'N/A', color: 'bg-slate-300' },
                        { name: 'BlueBottle Coffee', budget: '$8,200', status: 'Active', perf: '92%', color: 'bg-indigo-500' },
                      ].map((c, i) => (
                        <tr key={i} onClick={() => router.push('/projects')} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                          <td className="px-6 py-4 font-semibold text-sm text-slate-900 group-hover:text-primary transition-colors">{c.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{c.budget}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold ${c.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                              <span className={`w-1 h-1 rounded-full ${c.status === 'Active' ? 'bg-green-600' : 'bg-slate-400'}`}></span>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <span className="text-xs font-bold text-slate-900">{c.perf}</span>
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${c.color}`} style={{ width: c.perf !== 'N/A' ? c.perf : '0%' }}></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="card bg-slate-900 text-white border-none shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-2">Agency AI Agents</h3>
                  <p className="text-sm text-slate-400 mb-6 leading-relaxed">Automate your social strategy with our new AI-driven creative agents.</p>
                  <button onClick={() => triggerToast("Initiating AI agent deployment...")} className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">
                    Deploy Agent
                  </button>
                </div>
              </div>

              <div className="card">
                <h3 className="text-sm font-bold mb-6 text-slate-900">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => triggerToast("Opening campaign builder...")} className="p-4 bg-slate-50 rounded-xl border border-border hover:bg-slate-100 hover:border-slate-300 transition-all flex flex-col items-center gap-2 group">
                    <span className="text-lg group-hover:scale-110 transition-transform">📧</span>
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Campaign</span>
                  </button>
                  <button onClick={() => triggerToast("Generating invoice...")} className="p-4 bg-slate-50 rounded-xl border border-border hover:bg-slate-100 hover:border-slate-300 transition-all flex flex-col items-center gap-2 group">
                    <span className="text-lg group-hover:scale-110 transition-transform">📄</span>
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Invoice</span>
                  </button>
                  <button onClick={() => triggerToast("Opening support chat...")} className="p-4 bg-slate-50 rounded-xl border border-border hover:bg-slate-100 hover:border-slate-300 transition-all flex flex-col items-center gap-2 group">
                    <span className="text-lg group-hover:scale-110 transition-transform">💬</span>
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Support</span>
                  </button>
                  <button onClick={() => router.push('/settings')} className="p-4 bg-slate-50 rounded-xl border border-border hover:bg-slate-100 hover:border-slate-300 transition-all flex flex-col items-center gap-2 group">
                    <span className="text-lg group-hover:scale-110 transition-transform">⚙️</span>
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Settings</span>
                  </button>
                </div>
              </div>

              <div className="card bg-indigo-50 border-indigo-100">
                <h3 className="text-sm font-bold mb-4 text-indigo-900">Weekly Goal</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-indigo-700">Leads Generated</span>
                  <span className="text-xs font-bold text-indigo-900">42 / 50</span>
                </div>
                <div className="w-full h-2 bg-indigo-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '84%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* New Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCampaignModal(false)} />
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 animate-subtle-fade">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Create New Campaign</h2>
              <button onClick={() => setShowCampaignModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); setShowCampaignModal(false); triggerToast("Campaign successfully queued for deployment!"); }}>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campaign Name</label>
                <input type="text" placeholder="e.g. Summer Blitz 2026" className="input-field" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Budget Allocation</label>
                  <input type="text" placeholder="$5,000" className="input-field" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Channel</label>
                  <select className="input-field">
                    <option>Omnichannel</option>
                    <option>Social Only</option>
                    <option>Search Engine</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full btn-primary py-3 mt-4">
                Launch Campaign
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast.show && (
        <div className="fixed bottom-8 right-8 z-[110] animate-subtle-fade">
          <div className={`px-5 py-3 rounded-xl shadow-lg border flex items-center gap-3 bg-white ${showToast.type === 'success' ? 'border-green-100' : 'border-red-100'}`}>
            <div className={`w-2 h-2 rounded-full ${showToast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
            <p className="text-sm font-semibold text-slate-900">{showToast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, trend, trendType, icon }: any) {
  return (
    <div className="stat-card group cursor-pointer hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-indigo-50 group-hover:text-primary transition-colors">
          {icon}
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trendType === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {trend}
        </span>
      </div>
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <h2 className="text-2xl font-bold text-slate-900 mt-0.5">{value}</h2>
    </div>
  );
}
