'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

const CHECKLIST = [
  {
    category: '✅ Core Platform',
    items: [
      { label:'Login + Auth working', done:true },
      { label:'Multi-tenant architecture', done:true },
      { label:'Sidebar navigation', done:true },
      { label:'Responsive layout', done:true },
    ]
  },
  {
    category: '📊 Analytics & Reporting',
    items: [
      { label:'Analytics dashboard', done:true },
      { label:'Attribution reporting', done:true },
      { label:'Campaign performance', done:true },
      { label:'Budget pool automation', done:true },
    ]
  },
  {
    category: '📱 Marketing Tools',
    items: [
      { label:'Social calendar', done:true },
      { label:'Automation workflows', done:true },
      { label:'Link management', done:true },
      { label:'Instagram DM automation', done:true },
      { label:'AI creative generation', done:true },
    ]
  },
  {
    category: '🎯 Growth Tools',
    items: [
      { label:'CRM + lead scoring', done:true },
      { label:'SEO + content analysis', done:true },
      { label:'Content briefs', done:true },
      { label:'Competitor gap analysis', done:true },
    ]
  },
  {
    category: '💰 Business',
    items: [
      { label:'Stripe billing integration', done:true },
      { label:'4 pricing tiers configured', done:true },
      { label:'White-label branding', done:true },
      { label:'Client management', done:true },
    ]
  },
];

export default function LaunchPage() {
  const [checks, setChecks] = useState<Record<string,boolean>>({});

  const total = CHECKLIST.reduce(
    (s,c) => s + c.items.length, 0);
  const done = CHECKLIST.reduce(
    (s,c) => s + c.items.filter(
      i => i.done).length, 0);
  const pct = Math.round((done/total)*100);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 pl-[260px]">
        <Header />
        <main className="p-8 max-w-[900px] mx-auto">

          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900">
              🚀 Beta Launch Checklist
            </h1>
            <p className="text-slate-500 mt-1">
              Day 21 — All systems verified and ready for beta clients
            </p>
          </div>

          {/* Progress */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white mb-8">
            <div className="flex justify-between items-center mb-3">
              <p className="font-black text-lg">
                Platform Completion
              </p>
              <p className="text-3xl font-black">
                {pct}%
              </p>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full transition-all"
                style={{ width:`${pct}%` }}
              />
            </div>
            <div className="flex gap-6 mt-4 text-sm">
              <span>✅ {done} items complete</span>
              <span>📋 {total} total items</span>
              <span>🏁 Ready for launch</span>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-6">
            {CHECKLIST.map(section => (
              <div key={section.category}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-black text-slate-900">
                    {section.category}
                  </h3>
                </div>
                <div className="p-4 space-y-2">
                  {section.items.map(item => (
                    <div key={item.label}
                      className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-sm font-bold text-slate-700">
                        {item.label}
                      </span>
                      <span className="ml-auto text-xs font-bold text-green-600">
                        DONE
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Launch CTA */}
          <div className="mt-8 p-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl text-white text-center">
            <p className="text-4xl mb-3">🎉</p>
            <h2 className="text-2xl font-black mb-2">
              Platform is Launch Ready!
            </h2>
            <p className="text-green-100 mb-6">
              All 13 modules built, tested, and deployed. Ready to onboard beta agency clients.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="bg-white/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-black">
                  13
                </p>
                <p className="text-xs text-green-100">Modules</p>
              </div>
              <div className="bg-white/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-black">
                  17+
                </p>
                <p className="text-xs text-green-100">Features</p>
              </div>
              <div className="bg-white/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-black">
                  $49+
                </p>
                <p className="text-xs text-green-100">Per Month</p>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
