'use client';

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";

export default function TeamClientsPage() {
  return (
    <RoleGuard allowedRoles={['team', 'admin']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="team" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Assigned Clients</h1>
              <p className="text-slate-500">View and manage the clients currently assigned to your team profile.</p>
            </div>
            
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                💼
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Client Directory</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Your client assignments are being synchronized. You can view your current workload on the main team overview.
              </p>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
