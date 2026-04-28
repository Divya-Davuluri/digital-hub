'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

const REVENUE_DATA = {
  total: '$45,200',
  growth: '+15.4%',
  period: 'April 2026',
  stats: [
    { label: 'Monthly Recurring', value: '$38,500', trend: 'up' },
    { label: 'One-time Projects', value: '$6,700', trend: 'down' },
    { label: 'Avg. Revenue Per Client', value: '$3,766', trend: 'up' },
  ],
  transactions: [
    { id: 1, client: 'Acme Corp', date: '2026-04-25', amount: '$12,000', type: 'Subscription', status: 'Paid' },
    { id: 2, client: 'EcoWare', date: '2026-04-22', amount: '$4,200', type: 'Subscription', status: 'Paid' },
    { id: 3, client: 'Global Solutions', date: '2026-04-18', amount: '$8,500', type: 'Subscription', status: 'Pending' },
    { id: 4, client: 'Skyline Media', date: '2026-04-15', amount: '$2,500', type: 'Project', status: 'Paid' },
    { id: 5, client: 'TechFlow', date: '2026-04-10', amount: '$5,000', type: 'Project', status: 'Paid' },
  ]
};

export default function RevenuePage() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currency, setCurrency] = useState('USD ($)');
  const [taxRate, setTaxRate] = useState('15');

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
              <p className="text-text-muted font-medium">Financial performance for {REVENUE_DATA.period}</p>
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
            <div className="lg:col-span-2 relative overflow-hidden p-10 bg-gradient-to-br from-primary via-primary/80 to-secondary rounded-[2.5rem] shadow-2xl shadow-primary/20 group">
              <div className="relative z-10">
                <p className="text-white/80 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Total Revenue (MTD)</p>
                <h2 className="text-7xl font-black mb-8 tracking-tighter text-white">{REVENUE_DATA.total}</h2>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-white border border-white/10">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  {REVENUE_DATA.growth} vs last month
                </div>
              </div>
              {/* Abstract decorative elements */}
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
              <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-black/10 rounded-full blur-2xl"></div>
            </div>

            <div className="card flex flex-col justify-between py-10">
              <h4 className="font-black mb-8 text-text-muted uppercase tracking-[0.2em] text-[10px]">Revenue Breakdown</h4>
              <div className="space-y-8">
                {REVENUE_DATA.stats.map((stat, i) => (
                  <div key={i} className="flex justify-between items-center group">
                    <div>
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="text-2xl font-black group-hover:text-primary transition-colors">{stat.value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 ${stat.trend === 'up' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                      {stat.trend === 'up' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
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
                  {REVENUE_DATA.transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group cursor-default">
                      <td className="px-8 py-5 font-black group-hover:text-primary transition-colors">{t.client}</td>
                      <td className="px-8 py-5 text-sm text-text-muted font-medium">{t.date}</td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] px-3 py-1 bg-white/5 border border-white/5 rounded-full font-black uppercase tracking-widest text-text-muted">{t.type}</span>
                      </td>
                      <td className="px-8 py-5 font-mono font-bold text-white text-lg">{t.amount}</td>
                      <td className="px-8 py-5 text-right">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                          t.status === 'Paid' ? 'bg-green-400/10 text-green-400' : 'bg-amber-400/10 text-amber-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${t.status === 'Paid' ? 'bg-green-400' : 'bg-amber-400'}`}></span>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
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
