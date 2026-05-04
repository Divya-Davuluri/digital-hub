'use client';

import Sidebar from "../Sidebar";
import Header from "@/components/Header";

export default function ClientBillingPage() {
  const invoices = [
    { id: 'INV-001', date: 'May 1, 2026', amount: '$1,200.00', status: 'Paid' },
    { id: 'INV-002', date: 'Apr 1, 2026', amount: '$1,200.00', status: 'Paid' },
    { id: 'INV-003', date: 'Mar 1, 2026', amount: '$950.00', status: 'Paid' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="client" />
      <div className="flex-1 ml-[260px] flex flex-col">
        <Header />
        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-slate-900">Billing & Invoices</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your payment methods and view history.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Active Subscription</h3>
              <div className="flex items-center justify-between p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                    ★
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Agency Pro Plan</h4>
                    <p className="text-xs text-indigo-600 font-bold">Next billing: June 1, 2026</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">$1,200</div>
                  <div className="text-[10px] text-slate-500 uppercase font-black">per month</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Payment Method</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-8 bg-slate-100 rounded border border-slate-200 flex items-center justify-center font-bold text-[10px]">VISA</div>
                <div>
                  <div className="text-sm font-bold text-slate-900">•••• 4242</div>
                  <div className="text-[10px] text-slate-500 uppercase font-black">Expires 12/28</div>
                </div>
              </div>
              <button className="w-full py-2.5 text-xs font-bold text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-colors">
                Update Card
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Billing History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-8 py-4">Invoice ID</th>
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">Amount</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5 font-bold text-sm text-slate-900">{inv.id}</td>
                      <td className="px-8 py-5 text-sm text-slate-500">{inv.date}</td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-900">{inv.amount}</td>
                      <td className="px-8 py-5">
                        <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-bold border border-green-100">
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-indigo-600 hover:underline font-bold text-xs">PDF</button>
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
  );
}
