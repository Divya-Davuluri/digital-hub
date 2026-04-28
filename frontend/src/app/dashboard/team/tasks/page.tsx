'use client';

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function TeamTasksPage() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Review Nike Summer Campaign", priority: "High", status: "Pending", due: "Today" },
    { id: 2, title: "Approve Tesla Social Graphics", priority: "Medium", status: "Completed", due: "Yesterday" },
    { id: 3, title: "Generate Monthly ROI Report", priority: "High", status: "In Progress", due: "In 2 days" },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'Medium' });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const task = {
      id: tasks.length + 1,
      title: newTask.title,
      priority: newTask.priority,
      status: "Pending",
      due: "Today"
    };
    setTasks([task, ...tasks]);
    setShowModal(false);
    setNewTask({ title: '', priority: 'Medium' });
  };

  const markComplete = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: 'Completed' } : t));
  };

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
            <button 
              onClick={() => setShowModal(true)}
              className="btn-primary !py-2.5 !px-6 text-xs font-bold shadow-lg shadow-indigo-100"
            >
               + Create New Task
            </button>
          </div>

          <div className="card !p-0 overflow-hidden bg-white shadow-sm border border-slate-200 rounded-2xl">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
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
                               {task.status !== 'Completed' && (
                                 <button 
                                   onClick={() => markComplete(task.id)}
                                   className="text-xs font-bold text-indigo-600 hover:underline transition-colors"
                                 >
                                   Mark Complete
                                 </button>
                               )}
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

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 animate-subtle-fade">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Create New Task</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <form className="p-6 space-y-4" onSubmit={handleCreateTask}>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Task Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Update client ad copy" 
                  className="input-field" 
                  required 
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Priority Level</label>
                <select 
                  className="input-field"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
              <button type="submit" className="w-full btn-primary py-3 mt-4 text-sm font-bold">
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
