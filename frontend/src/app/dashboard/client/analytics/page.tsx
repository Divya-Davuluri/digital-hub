'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";
import apiCall from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import dynamic from 'next/dynamic';

const ResponsiveContainer = dynamic<any>(() => import('recharts').then(mod => mod.ResponsiveContainer) as any, { ssr: false });
import { 
  AreaChart as RechartsAreaChart, Area as RechartsArea, XAxis as RechartsXAxis, YAxis as RechartsYAxis, 
  CartesianGrid as RechartsCartesianGrid, Tooltip as RechartsTooltip, Cell as RechartsCell,
  BarChart as RechartsBarChart, Bar as RechartsBar
} from 'recharts';

const AreaChart = RechartsAreaChart as any;
const Area = RechartsArea as any;
const XAxis = RechartsXAxis as any;
const YAxis = RechartsYAxis as any;
const CartesianGrid = RechartsCartesianGrid as any;
const Tooltip = RechartsTooltip as any;
const BarChart = RechartsBarChart as any;
const Bar = RechartsBar as any;
const Cell = RechartsCell as any;

export default function ClientAnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>({
    impressions: 0, clicks: 0, conversions: 0, spent: 0, budget: 0
  });
  const [roas, setRoas] = useState('0.00');
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/client/analytics');
      if (data.success) {
        setAnalytics(data.analytics || []);
        setCampaigns(data.campaigns || []);
        setTotals(data.totals || {});
        setRoas(data.roas || '0.00');
      }
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadAnalytics();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar role="client" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <div className="p-8 text-center py-24 text-slate-400 italic">Analyzing performance data...</div>
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
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Performance Intelligence</h1>
              <p className="text-slate-500">Real-time attribution and ROI visualization.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
              <MiniCard title="Impressions" value={totals.impressions.toLocaleString()} icon="👁️" />
              <MiniCard title="Clicks" value={totals.clicks.toLocaleString()} icon="🖱️" />
              <MiniCard title="Conversions" value={totals.conversions.toLocaleString()} icon="🎯" />
              <MiniCard title="Total Spent" value={`$${totals.spent.toLocaleString()}`} icon="💰" />
              <MiniCard title="ROAS" value={`${roas}x`} icon="🚀" highlight />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              <div className="lg:col-span-2 p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-lg font-bold text-slate-900">Revenue & Growth Trend</h3>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Historical Performance</span>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                      <Area type="monotone" dataKey="spent" name="Spend" stroke="#ef4444" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Efficiency metrics</h3>
                <div className="space-y-6">
                   <MetricRow label="Avg. Click-Through Rate" value={`${totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : 0}%`} />
                   <MetricRow label="Avg. Cost Per Click" value={`$${totals.clicks > 0 ? (totals.spent / totals.clicks).toFixed(2) : 0}`} />
                   <MetricRow label="Avg. Conversion Rate" value={`${totals.clicks > 0 ? ((totals.conversions / totals.clicks) * 100).toFixed(2) : 0}%`} />
                   <MetricRow label="Budget Utilization" value={`${totals.budget > 0 ? ((totals.spent / totals.budget) * 100).toFixed(1) : 0}%`} />
                </div>
                
                <div className="mt-12">
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Platform Breakdown</h4>
                   <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={campaigns.slice(0, 5)}>
                            <Bar dataKey="spent" radius={[4, 4, 0, 0]}>
                               {campaigns.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'][index % 5]} />
                               ))}
                            </Bar>
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
               <h3 className="text-lg font-bold text-slate-900 mb-6">Top Performing Campaigns</h3>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                           <th className="pb-4">Campaign</th>
                           <th className="pb-4">Platform</th>
                           <th className="pb-4">Conversions</th>
                           <th className="pb-4">Spent</th>
                           <th className="pb-4">CTR</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {campaigns.slice(0, 5).map((c: any) => (
                           <tr key={c.id}>
                              <td className="py-4 font-bold text-slate-900">{c.name}</td>
                              <td className="py-4 text-slate-500 text-sm uppercase font-bold">{c.platform || 'Google'}</td>
                              <td className="py-4 text-slate-900 font-bold">{c.conversions}</td>
                              <td className="py-4 text-slate-900">${Number(c.spent).toLocaleString()}</td>
                              <td className="py-4 text-indigo-600 font-bold">
                                 {c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : 0}%
                              </td>
                           </tr>
                        ))}
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

function MiniCard({ title, value, icon, highlight }: any) {
  return (
    <div className={`p-5 rounded-2xl border ${highlight ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-900'} shadow-sm`}>
      <div className="flex items-center gap-3 mb-2">
         <span className="text-lg">{icon}</span>
         <p className={`text-[10px] font-bold uppercase tracking-widest ${highlight ? 'text-white/70' : 'text-slate-400'}`}>{title}</p>
      </div>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}

function MetricRow({ label, value }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-500 font-medium">{label}</span>
      <span className="text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
}
