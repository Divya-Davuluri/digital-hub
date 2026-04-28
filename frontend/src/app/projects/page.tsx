'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

const INITIAL_PROJECTS = [
  { id: 1, name: 'Q4 Ad Campaign', client: 'Acme Corp', progress: 75, dueDate: '2026-11-15', status: 'In Progress' },
  { id: 2, name: 'Brand Refresh', client: 'EcoWare', progress: 30, dueDate: '2026-12-01', status: 'In Progress' },
  { id: 3, name: 'SEO Optimization', client: 'Global Solutions', progress: 100, dueDate: '2026-10-20', status: 'Completed' },
  { id: 4, name: 'Social Media Strategy', client: 'Skyline Media', progress: 10, dueDate: '2027-01-10', status: 'Planning' },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', client: '', progress: 0, dueDate: '', status: 'Planning' });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const id = projects.length + 1;
    setProjects([...projects, { ...newProject, id, progress: Number(newProject.progress) }]);
    setIsModalOpen(false);
    setNewProject({ name: '', client: '', progress: 0, dueDate: '', status: 'Planning' });
  };

  return (
    <div className="flex min-h-screen bg-background text-text">
      <Sidebar />
      
      <div className="flex-1 ml-64 min-h-screen bg-grid relative">
        <Header />
        
        <main className="p-8 max-w-[1400px] mx-auto animate-fade-in">
          <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div>
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] hover:text-primary transition-all mb-4 group"
              >
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Workspace
              </button>
              <h1 className="text-4xl font-black tracking-tight text-white mb-2">Project Pipeline</h1>
              <p className="text-text-muted font-medium">Tracking the execution of high-impact marketing initiatives.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-primary !px-8 flex items-center gap-3 shadow-xl shadow-primary/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Initiate Project
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div key={project.id} className="card group hover:scale-[1.02] transition-all duration-300 cursor-default">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-black group-hover:text-primary transition-colors tracking-tight">{project.name}</h3>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">{project.client}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    project.status === 'Completed' ? 'bg-green-400/10 text-green-400' : 
                    project.status === 'In Progress' ? 'bg-primary/10 text-primary' : 'bg-white/5 text-text-muted'
                  }`}>
                    {project.status}
                  </span>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-text-muted">Completion</span>
                    <span className="text-white">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Due {project.dueDate}
                  </div>
                  <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Full Details</button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-fade-in">
          <div className="glass-panel w-full max-w-md shadow-2xl overflow-hidden scale-in">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-xl font-black uppercase tracking-tight">Project Initiation</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-white transition-colors p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Project Identifier</label>
                <input 
                  type="text" 
                  required
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  placeholder="e.g. Q4 SEO Campaign"
                  className="input-field"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Associated Client</label>
                <input 
                  type="text" 
                  required
                  value={newProject.client}
                  onChange={(e) => setNewProject({...newProject, client: e.target.value})}
                  placeholder="e.g. Acme Corp"
                  className="input-field"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Target Date</label>
                  <input 
                    type="date" 
                    required
                    value={newProject.dueDate}
                    onChange={(e) => setNewProject({...newProject, dueDate: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Initial Velocity (%)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100"
                    required
                    value={newProject.progress}
                    onChange={(e) => setNewProject({...newProject, progress: Number(e.target.value)})}
                    className="input-field font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Deployment Status</label>
                <select 
                  value={newProject.status}
                  onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                  className="input-field appearance-none cursor-pointer"
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
              
              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 btn-secondary"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Confirm Initiation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
