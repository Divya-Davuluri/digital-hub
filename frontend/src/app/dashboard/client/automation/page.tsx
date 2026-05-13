'use client';

import { useState, useEffect } from 'react';
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";
import dynamic from 'next/dynamic';

const ResponsiveContainer = dynamic<any>(() => import('recharts').then(mod => mod.ResponsiveContainer) as any, { ssr: false });
import { 
  AreaChart as RechartsAreaChart, Area as RechartsArea, XAxis as RechartsXAxis, YAxis as RechartsYAxis, 
  CartesianGrid as RechartsCartesianGrid, Tooltip as RechartsTooltip, ReferenceLine as RechartsReferenceLine
} from 'recharts';

const AreaChart = RechartsAreaChart as any;
const Area = RechartsArea as any;
const XAxis = RechartsXAxis as any;
const YAxis = RechartsYAxis as any;
const CartesianGrid = RechartsCartesianGrid as any;
const Tooltip = RechartsTooltip as any;
const ReferenceLine = RechartsReferenceLine as any;

export default function AutomationPage() {
  const [forecastData, setForecastData] = useState<any[]>([]);

  useEffect(() => {
    // Generate dummy forecast data based on trend
    const data = [];
    let currentSpend = 1500;
    for (let i = 1; i <= 30; i++) {
      currentSpend += Math.random() * 100 - 40;
      data.push({
        day: `Day ${i}`,
        projected: Math.round(currentSpend),
        confidence: Math.round(currentSpend * 0.9 + Math.random() * 200)
      });
    }
    setForecastData(data);
  }, []);

  return (
    <RoleGuard allowedRoles={['client', 'admin']}>
      <div className="flex min-h-screen bg-white">
        <Sidebar role="client" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8 max-w-7xl mx-auto w-full">
            <div className="mb-10">
              <h1 className="text-3xl font-black text-slate-900">Automation & Forecasting</h1>
              <p className="text-slate-500">AI-driven performance projections and autonomous budget rules.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Forecast Chart */}
              <div className="lg:col-span-2 p-8 bg-white border border-slate-100 rounded-3xl shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-bold text-slate-900">30-Day Budget Projection</h3>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Projected
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="w-2 h-2 rounded-full bg-slate-200"></span> Confidence
                    </span>
                  </div>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" hide />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="confidence" stroke="transparent" fill="#f1f5f9" />
                      <Area type="monotone" dataKey="projected" stroke="#6366f1" fill="transparent" strokeWidth={3} />
                      <ReferenceLine y={2000} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Monthly Limit', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p className="text-xs text-indigo-700 font-medium flex items-center gap-2">
                    <span>💡</span> <strong>AI Insight:</strong> Your current spend velocity suggests you will hit your budget cap on Day 24. We recommend a 15% reduction in top-of-funnel spend to maintain visibility through month-end.
                  </p>
                </div>
              </div>

              {/* Sidebar: Recommendations & Rules */}
              <div className="space-y-6">
                <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Smart Recommendations</h3>
                  <div className="space-y-4">
                    <RecommendationItem 
                      title="Scale 'Spring Sale' Campaign" 
                      desc="Performance is 40% above benchmark. Increasing budget by $500/day could yield 22% more conversions."
                      type="positive"
                    />
                    <RecommendationItem 
                      title="Pause Low CTR Creative" 
                      desc="Asset 'nike_logo_red' is underperforming in the Cloud Tech campaign. CTR is below 0.5%."
                      type="negative"
                    />
                  </div>
                </div>

                <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Autonomous Alert Rules</h3>
                  <div className="space-y-4">
                    <AlertRule label="Budget Threshold" value="80% Spent" active />
                    <AlertRule label="Low CTR Alert" value="< 1.0%" active />
                    <AlertRule label="High CPC Alert" value="> $5.00" active={false} />
                    <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-400 hover:text-indigo-600 transition-all">
                      + Create New Rule
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

function RecommendationItem({ title, desc, type }: any) {
  return (
    <div className={`p-4 rounded-2xl border ${type === 'positive' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/50 border-amber-100'}`}>
      <p className={`text-xs font-bold ${type === 'positive' ? 'text-emerald-700' : 'text-amber-700'} mb-1`}>{title}</p>
      <p className="text-[11px] text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function AlertRule({ label, value, active }: any) {
  return (
    <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-all">
      <div>
        <p className="text-xs font-bold text-slate-900">{label}</p>
        <p className="text-[10px] text-slate-500 font-bold">{value}</p>
      </div>
      <div className={`w-8 h-4 rounded-full p-0.5 transition-all cursor-pointer ${active ? 'bg-indigo-600' : 'bg-slate-200'}`}>
        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-all ${active ? 'translate-x-4' : ''}`} />
      </div>
    </div>
  );
}
