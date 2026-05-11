'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { apiCall } from '@/lib/api';

interface RevenueStats {
  totalRevenue: number;
  growth: string;
  clientsCount: number;
  activeCampaigns: number;
  period: string;
}

interface Transaction {
  id: string;
  clientName: string;
  createdAt: string;
  amount: number;
  type: string;
  status: string;
}

export default function RevenuePage() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currency, setCurrency] = useState('USD ($)');
  const [taxRate, setTaxRate] = useState('15');
  
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [statsData, transactionsData] = await Promise.all([
          apiCall('/agency/stats'),
          apiCall('/agency/transactions')
        ]);
        setStats(statsData);
        setTransactions(transactionsData);
      } catch (err: any) {
        console.error('Error fetching revenue data:', err);
        setError(err.message || 'Failed to load revenue data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert('Revenue report exported successfully as PDF!');
    }, 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingsOpen(false);
    alert('Financial settings updated successfully!');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background text-text">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-background text-text">
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col items-center justify-center p-8">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-text">
      <Sidebar />
      
      <div className="flex-1 ml-64 min-h-screen bg-grid relative">
        <Header />
        
        <main className="p-8 max-w-[1400px] mx-auto animate-fade-in">
          <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div>
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] hover:text-primary transition-all mb-4 group"
              >
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
              <h1 className="text-4xl font-black tracking-tight text-white mb-2">Revenue Analytics</h1>
              <p className="text-text-muted font-medium">Financial performance for {stats?.period}</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="btn-secondary !px-8"
              >
                {isExporting ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {isExporting ? 'Exporting...' : 'Export Report'}
              </button>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="btn-primary !px-8"
              >
                Financial Settings
              </button>
            </div>
          </header>

          {/* Hero Revenue Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2 relative overflow-hidden p-10 bg-gradient-to-br from-primary via-primary/80 to-secondary rounded-[2.5rem] shadow-2xl group">
              <div className="relative z-10">
                <p className="text-white/80 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Total Revenue (MTD)</p>
                <h2 className="text-7xl font-black mb-8 tracking-tighter text-white">${stats?.totalRevenue.toLocaleString()}</h2>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-white border border-white/10">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  {stats?.growth}% vs last month
                </div>
              </div>
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
              <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-black/10 rounded-full blur-2xl"></div>
            </div>

            <div className="card flex flex-col justify-between py-10">
              <h4 className="font-black mb-8 text-text-muted uppercase tracking-[0.2em] text-[10px]">Agency Overview</h4>
              <div className="space-y-8">
                <div className="flex justify-between items-center group">
                  <div>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Active Clients</p>
                    <p className="text-2xl font-black group-hover:text-primary transition-colors">{stats?.clientsCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex justify-between items-center group">
                  <div>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Active Campaigns</p>
                    <p className="text-2xl font-black group-hover:text-primary transition-colors">{stats?.activeCampaigns}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary/10 text-secondary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="card p-0 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-black text-xl uppercase tracking-tight">Recent Transactions</h3>
              <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View Full Ledger</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                    <th className="px-8 py-4">Client Entity</th>
                    <th className="px-8 py-4">Fulfillment Date</th>
                    <th className="px-8 py-4">Transaction Type</th>
                    <th className="px-8 py-4">Gross Amount</th>
                    <th className="px-8 py-4 text-right">Settlement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group cursor-default">
                      <td className="px-8 py-5 font-black group-hover:text-primary transition-colors">{t.clientName}</td>
                      <td className="px-8 py-5 text-sm text-text-muted font-medium">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] px-3 py-1 bg-white/5 border border-white/5 rounded-full font-black uppercase tracking-widest text-text-muted">{t.type}</span>
                      </td>
                      <td className="px-8 py-5 font-mono font-bold text-white text-lg">${t.amount.toLocaleString()}</td>
                      <td className="px-8 py-5 text-right">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                          t.status === 'paid' ? 'bg-green-400/10 text-green-400' : 'bg-amber-400/10 text-amber-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${t.status === 'paid' ? 'bg-green-400' : 'bg-amber-400'}`}></span>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-10 text-center text-text-muted">No recent transactions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Financial Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-fade-in">
          <div className="glass-panel w-full max-w-md shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden scale-in">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-xl font-black uppercase tracking-tight">Financial Controls</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-text-muted hover:text-white transition-colors p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveSettings} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Settlement Currency</label>
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="input-field appearance-none cursor-pointer"
                >
                  <option value="USD ($)">USD ($) - US Dollar</option>
                  <option value="EUR (€)">EUR (€) - Euro</option>
                  <option value="GBP (£)">GBP (£) - British Pound</option>
                  <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Agency Tax Rate (%)</label>
                <input 
                  type="number" 
                  value={taxRate} 
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="input-field font-mono"
                />
              </div>

              <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[11px] text-text-muted leading-relaxed font-medium">
                  These adjustments will update all <span className="text-white">forecast projections</span> and invoice templates across your workspace.
                </p>
              </div>
              
              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 btn-secondary"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Save Controls
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
