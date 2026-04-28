'use client';

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function TeamTasksPage() {
  const [tasks] = useState([
    { id: 1, title: "Review Nike Summer Campaign", priority: "High", status: "Pending", due: "Today" },
    { id: 2, title: "Approve Tesla Social Graphics", priority: "Medium", status: "Completed", due: "Yesterday" },
    { id: 3, title: "Generate Monthly ROI Report", priority: "High", status: "In Progress", due: "In 2 days" },
  ]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="team" />
      <div className="flex-1 ml-[260px] flex flex-col">
        <Header />
        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Task Management</h1>
              <p className="text-sm text-slate-500 mt-1">Track approvals, report generation, and campaign status updates.</p>
            </div>
            <button className="btn-primary !py-2.5 !px-6 text-xs font-bold shadow-lg shadow-indigo-100">
               + Create New Task
            </button>
          </div>

          <div className="card !p-0 overflow-hidden bg-white">
             <div className="p-6 border-b border-border flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900">Active Tasks</h3>
                <div className="flex gap-2">
                   <button className="px-3 py-1.5 text-[11px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">Filter: All</button>
                   <button className="px-3 py-1.5 text-[11px] font-bold bg-indigo-50 text-indigo-600 rounded-lg">Status: Pending</button>
                </div>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                      <tr>
                         <th className="px-8 py-4">Task Description</th>
                         <th className="px-8 py-4">Priority</th>
                         <th className="px-8 py-4">Status</th>
                         <th className="px-8 py-4">Due Date</th>
                         <th className="px-8 py-4 text-right">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {tasks.map((task) => (
                         <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-8 py-5">
                               <span className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">{task.title}</span>
                            </td>
                            <td className="px-8 py-5">
                               <span className={`text-[10px] font-black uppercase tracking-tighter ${task.priority === 'High' ? 'text-red-500' : 'text-amber-500'}`}>
                                  {task.priority}
                               </span>
                            </td>
                            <td className="px-8 py-5">
                               <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  task.status === 'Completed' 
                                     ? 'bg-green-50 text-green-700 border-green-100' 
                                     : task.status === 'In Progress'
                                     ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                     : 'bg-slate-50 text-slate-700 border-slate-200'
                               }`}>
                                  {task.status}
                               </span>
                            </td>
                            <td className="px-8 py-5 text-xs text-slate-500 font-medium">{task.due}</td>
                            <td className="px-8 py-5 text-right">
                               <button className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors">Mark Complete</button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             {tasks.length === 0 && (
               <div className="p-20 text-center">
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">All Tasks Completed</h3>
                  <p className="text-sm text-slate-500">You&apos;re all caught up for the day!</p>
               </div>
             )}
          </div>
        </main>
      </div>
    </div>
  );
}
