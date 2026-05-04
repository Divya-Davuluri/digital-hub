'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { apiFetch } from '@/lib/api';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', clientName: '', completion: 0, dueDate: '', status: 'PLANNING' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/projects');
      setProjects(data);
      setError('');
    } catch (err: any) {
      setError('Failed to load projects: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify({
          title: newProject.title,
          clientName: newProject.clientName,
          status: newProject.status,
          dueDate: newProject.dueDate
        }),
      });
      setProjects([created, ...projects]);
      setIsModalOpen(false);
      setNewProject({ title: '', clientName: '', completion: 0, dueDate: '', status: 'PLANNING' });
    } catch (err: any) {
      alert('Failed to create project: ' + err.message);
    } finally {
      setSaving(false);
    }
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

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
               <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
               <p className="text-text-muted font-bold text-xs uppercase tracking-widest">Accessing Database...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl text-center">
              <p className="text-red-400 font-bold">{error}</p>
              <button onClick={fetchProjects} className="mt-4 text-xs font-black uppercase text-white hover:underline">Retry Connection</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.length === 0 && (
                <div className="lg:col-span-3 py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                   <p className="text-text-muted font-bold uppercase tracking-widest text-xs">No active projects found in pipeline</p>
                </div>
              )}
              {projects.map((project) => (
                <div key={project.id} className="card group hover:scale-[1.02] transition-all duration-300 cursor-default">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-black group-hover:text-primary transition-colors tracking-tight">{project.title}</h3>
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">{project.clientName}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      project.status === 'COMPLETED' ? 'bg-green-400/10 text-green-400' : 
                      project.status === 'IN PROGRESS' ? 'bg-primary/10 text-primary' : 'bg-white/5 text-text-muted'
                    }`}>
                      {project.status?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-text-muted">Completion</span>
                      <span className="text-white">{project.completion}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                        style={{ width: `${project.completion}%` }}
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
          )}
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
                  value={newProject.title}
                  onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                  placeholder="e.g. Q4 SEO Campaign"
                  className="input-field"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Associated Client</label>
                <input 
                  type="text" 
                  required
                  value={newProject.clientName}
                  onChange={(e) => setNewProject({...newProject, clientName: e.target.value})}
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
                   <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Initial Status</label>
                   <select 
                     value={newProject.status}
                     onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                     className="input-field appearance-none cursor-pointer"
                   >
                     <option value="PLANNING">Planning</option>
                     <option value="IN PROGRESS">In Progress</option>
                     <option value="COMPLETED">Completed</option>
                   </select>
                </div>
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
                  disabled={saving}
                  className="flex-1 btn-primary"
                >
                  {saving ? 'Saving...' : 'Confirm Initiation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
