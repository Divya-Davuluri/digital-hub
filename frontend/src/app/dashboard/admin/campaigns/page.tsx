'use client';

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";

export default function AdminCampaignsPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="admin" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Global Campaigns</h1>
              <p className="text-slate-500">Monitor and manage all active campaigns across all client accounts.</p>
            </div>
            
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                🚀
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Campaign Manager</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                This module is being synchronized with your advertising platforms. Full campaign management will be available shortly.
              </p>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
