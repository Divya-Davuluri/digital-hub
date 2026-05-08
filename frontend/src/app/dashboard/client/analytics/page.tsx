'use client';

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";

export default function ClientAnalyticsPage() {
  return (
    <RoleGuard allowedRoles={['client', 'admin']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="client" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Deep Analytics</h1>
              <p className="text-slate-500">Advanced performance breakdowns and audience insights.</p>
            </div>
            
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                📈
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Analytics Engine</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Our deep analytics engine is processing your campaign data. High-resolution insights will be available here soon.
              </p>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
