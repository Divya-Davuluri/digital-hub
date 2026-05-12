'use client';

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import RoleGuard from "@/components/RoleGuard";
import CampaignWizard from "@/components/campaigns/CampaignWizard";

export default function NewCampaignPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'team']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8 max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Campaign</h1>
              <p className="text-slate-500">Choose your objective and platform to launch a cross-channel marketing initiative.</p>
            </div>
            
            <CampaignWizard />
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
