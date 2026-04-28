'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

const ANALYTICS_DATA = {
  overview: [
    { label: 'Total Conversions', value: '1,284', growth: '+12.5%', trend: 'up' },
    { label: 'Avg. CTR', value: '3.42%', growth: '+0.8%', trend: 'up' },
    { label: 'CPC', value: '$1.12', growth: '-5.2%', trend: 'down' },
    { label: 'ROI', value: '420%', growth: '+22.1%', trend: 'up' },
  ],
  campaigns: [
    { id: 1, name: 'Spring Sale 2026', platform: 'Meta Ads', spend: '$4,500', conv: 412, roas: '4.2x' },
    { id: 2, name: 'Brand Awareness', platform: 'Google Ads', spend: '$8,200', conv: 284, roas: '2.1x' },
    { id: 3, name: 'Retargeting Q2', platform: 'Meta Ads', spend: '$2,100', conv: 356, roas: '6.8x' },
    { id: 4, name: 'Product Launch', platform: 'LinkedIn', spend: '$12,000', conv: 112, roas: '1.5x' },
  ],
  trafficSources: [
    { source: 'Organic Search', percentage: 45, color: 'bg-primary' },
    { source: 'Paid Social', percentage: 30, color: 'bg-secondary' },
    { source: 'Direct', percentage: 15, color: 'bg-blue-400' },
    { source: 'Referral', percentage: 10, color: 'bg-green-400' },
  ]
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('performance');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="flex min-h-screen bg-background text-text">
      <Sidebar />
      
      <div className="flex-1 ml-64 min-h-screen bg-grid relative">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10" />
        
        <Header />
        
        <main className="p-8 max-w-[1400px] mx-auto animate-fade-in relative z-10">
          <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div>
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] hover:text-primary transition-all mb-4 group"
              >
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Workspace
              </button>
              <h1 className="text-4xl font-black tracking-tight text-white mb-2">Marketing Analytics</h1>
              <p className="text-text-muted font-medium">Deep insights into your agency&apos;s campaign performance and ROI.</p>
            </div>
            
            <div className="flex glass-panel p-1.5 rounded-2xl relative z-20">
              {['performance', 'campaigns', 'audience'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    activeTab === tab 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </header>

          {activeTab === 'performance' && (
            <div className="animate-fade-in">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {ANALYTICS_DATA.overview.map((stat, i) => (
                  <div 
                    key={i} 
                    onClick={triggerToast}
                    className="card group hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                  >
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4 group-hover:text-primary transition-colors">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-black tracking-tight">{stat.value}</h3>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${
                        stat.trend === 'up' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'
                      }`}>
                        {stat.growth}
                      </span>
                    </div>
                    <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${stat.trend === 'up' ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.3)]' : 'bg-red-400'} transition-all duration-1000 delay-300`} 
                        style={{ width: '70%' }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Campaigns Table */}
                <div className="lg:col-span-2 card p-0 overflow-hidden">
                  <div className="p-8 border-b border-white/5 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-xl">Active Campaigns</h3>
                      <p className="text-xs text-text-muted mt-1 font-medium">Real-time performance across platforms</p>
                    </div>
                    <button 
                      onClick={() => alert("Campaign deployment wizard initializing...")}
                      className="btn-primary !px-6 !py-2.5 text-xs"
                    >
                      New Campaign
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/[0.02] text-[10px] font-black text-text-muted uppercase tracking-widest">
                          <th className="px-8 py-4">Campaign Name</th>
                          <th className="px-8 py-4">Platform</th>
                          <th className="px-8 py-4">Spend</th>
                          <th className="px-8 py-4">Conversions</th>
                          <th className="px-8 py-4 text-right">ROAS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {ANALYTICS_DATA.campaigns.map((c) => (
                          <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={triggerToast}>
                            <td className="px-8 py-5">
                              <p className="font-bold group-hover:text-primary transition-colors">{c.name}</p>
                            </td>
                            <td className="px-8 py-5">
                              <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-text-muted">{c.platform}</span>
                            </td>
                            <td className="px-8 py-5 font-mono text-sm font-medium">{c.spend}</td>
                            <td className="px-8 py-5 font-black text-white">{c.conv}</td>
                            <td className="px-8 py-5 text-right font-black text-primary">{c.roas}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Traffic Sources */}
                <div className="card h-fit space-y-10">
                  <div>
                    <h3 className="font-bold text-xl mb-1">Traffic Distribution</h3>
                    <p className="text-xs text-text-muted font-medium">Top referral channels this month</p>
                  </div>
                  
                  <div className="space-y-8">
                    {ANALYTICS_DATA.trafficSources.map((source, i) => (
                      <div key={i} className="space-y-3">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-text-muted uppercase tracking-widest text-[10px]">{source.source}</span>
                          <span className="text-white">{source.percentage}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${source.color} transition-all duration-1000 shadow-[0_0_15px_rgba(0,0,0,0.5)]`} 
                            style={{ width: `${source.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="relative overflow-hidden p-6 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl border border-primary/20">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" /></svg>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">Pro Insight</p>
                    </div>
                    <p className="text-sm text-text-muted leading-relaxed">
                      Your <span className="text-white font-bold">organic search</span> traffic has increased by 15% this week. Consider shifting more budget to SEO-focused content.
                    </p>
                    <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-primary/20 rounded-full blur-2xl" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="card h-96 flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-6">
                 <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
              </div>
              <h2 className="text-2xl font-black mb-2">Campaign Deep-Dive</h2>
              <p className="text-text-muted max-w-md">Granular data for specific campaigns and multi-channel attribution views are currently being optimized.</p>
            </div>
          )}

          {activeTab === 'audience' && (
            <div className="card h-96 flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="w-20 h-20 bg-green-400/10 text-green-400 rounded-full flex items-center justify-center mb-6">
                 <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h2 className="text-2xl font-black mb-2">Audience Segmentation</h2>
              <p className="text-text-muted max-w-md">Detailed demographics, behavioral mapping, and high-value customer cohorts will appear here.</p>
            </div>
          )}
        </main>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-10 right-10 z-[100] animate-slide-up">
          <div className="px-6 py-4 rounded-2xl shadow-2xl bg-primary/10 border border-primary/20 backdrop-blur-xl flex items-center gap-4 text-primary">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-widest">Detail view loading... Fetching real-time records.</p>
          </div>
        </div>
      )}
    </div>
  );
}
