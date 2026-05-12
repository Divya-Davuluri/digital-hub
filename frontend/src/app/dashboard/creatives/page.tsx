'use client';

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";
import CreativeLibrary from "@/components/campaigns/CreativeLibrary";

export default function CreativesPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'team']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8 h-[calc(100vh-80px)]">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Creative Assets</h1>
                <p className="text-slate-500 mt-1">Store and manage your media, copy, and templates for use in campaigns.</p>
              </div>
            </div>
            
            <div className="h-[calc(100%-100px)]">
              <CreativeLibrary />
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
