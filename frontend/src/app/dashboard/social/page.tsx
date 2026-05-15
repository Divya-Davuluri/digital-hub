'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import {
  Calendar, List, Grid, Plus, Clock, Check,
  X, ChevronLeft, ChevronRight, AlertCircle, CheckCircle,
  Edit, Trash2, Eye, Send, BookOpen, Upload,
  MoreVertical, MessageSquare, Globe, Share2
} from 'lucide-react';
import toast from 'react-hot-toast';

const PLATFORM_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  icon: any;
}> = {
  meta:      { label:'Meta',      color:'#fff', bgColor:'#1877F2', icon: 'f' },
  facebook:  { label:'Meta',      color:'#fff', bgColor:'#1877F2', icon: 'f' },
  tiktok:    { label:'TikTok',    color:'#fff', bgColor:'#010101', icon: '♪' },
  linkedin:  { label:'LinkedIn',  color:'#fff', bgColor:'#0A66C2', icon: 'in' },
  instagram: { label:'Instagram', color:'#fff', bgColor:'#E1306C', icon: '📷' },
  youtube:   { label:'YouTube',   color:'#fff', bgColor:'#FF0000', icon: '▶' },
  x:         { label:'X',         color:'#fff', bgColor:'#000000', icon: '𝕏' },
};

const PlatformBadge = ({ platform }: { platform: string }) => {
  const config = PLATFORM_CONFIG[platform.toLowerCase()] 
    || { label: platform, color:'#fff', bgColor:'#6366F1', icon:'?' };
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm"
      style={{ backgroundColor: config.bgColor, color: config.color }}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    draft:     'bg-gray-100 text-gray-600',
    pending:   'bg-yellow-100 text-yellow-700',
    approved:  'bg-emerald-100 text-emerald-700',
    scheduled: 'bg-indigo-100 text-indigo-700',
    published: 'bg-slate-100 text-slate-600',
    rejected:  'bg-rose-100 text-rose-700',
    failed:    'bg-red-200 text-red-800',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
};

export default function SocialPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [view, setView] = useState<'month' | 'week' | 'list' | 'approval'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [library, setLibrary] = useState<any[]>([]);
  const [bestTimes, setBestTimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  // Form State
  const [form, setForm] = useState({
    title: '',
    content: '',
    platforms: [] as string[],
    scheduledDate: '',
    scheduledTime: '',
    hashtags: [] as string[],
    firstComment: '',
    mediaUrl: '',
    mediaType: 'text'
  });

  useEffect(() => {
    loadPosts();
    loadLibrary();
  }, []);

  const loadPosts = async () => {
    try {
      const res = await apiCall('/social/posts');
      const data = res?.data || res || [];
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load posts:', err);
      setPosts(getDemoPostsFallback());
    } finally {
      setLoading(false);
    }
  };

  const loadLibrary = async () => {
    try {
      const res = await apiCall('/social/library');
      const data = res?.data || res || [];
      setLibrary(Array.isArray(data) ? data : []);
    } catch (err) {
      setLibrary(getDemoLibraryFallback());
    }
  };

  const handleCreatePost = async (submitType: 'draft' | 'pending') => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.content.trim()) { toast.error('Content is required'); return; }
    if (form.platforms.length === 0) { toast.error('Select at least one platform'); return; }
    
    try {
      const scheduledAt = form.scheduledDate && form.scheduledTime
        ? new Date(`${form.scheduledDate}T${form.scheduledTime}`).toISOString()
        : null;

      const res = await apiCall('/social/posts', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          scheduledAt,
          status: submitType === 'draft' ? 'draft' : 'pending',
        })
      });
      
      if (res?.success || res?.data) {
        toast.success(submitType === 'draft' ? 'Draft saved!' : 'Post submitted for approval!');
        setShowCreateModal(false);
        setForm({
          title: '', content: '', platforms: [], scheduledDate: '',
          scheduledTime: '', hashtags: [], firstComment: '',
          mediaUrl: '', mediaType: 'text'
        });
        loadPosts();
      }
    } catch (err) {
      toast.error('Failed to create post');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiCall(`/social/posts/${id}/approve`, { method: 'POST' });
      toast.success('Post approved!');
      loadPosts();
    } catch (err) {
      toast.error('Approval failed');
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      await apiCall(`/social/posts/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      toast.success('Post rejected');
      loadPosts();
    } catch (err) {
      toast.error('Rejection failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await apiCall(`/social/posts/${id}`, { method: 'DELETE' });
      toast.success('Post deleted');
      loadPosts();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const days = [];
    
    for (let i = 0; i < firstDay; i++) { days.push(null); }
    for (let d = 1; d <= daysInMonth; d++) { days.push(new Date(year, month, d)); }
    return days;
  };

  const filteredPosts = activeFilter === 'all'
    ? posts
    : posts.filter(p => {
        const platforms = Array.isArray(p.platforms) ? p.platforms : JSON.parse(p.platforms || '[]');
        return platforms.includes(activeFilter);
      });

  const getPostsForDay = (date: Date | null) => {
    if (!date) return [];
    return filteredPosts.filter(post => {
      if (!post.scheduledAt) return false;
      const postDate = new Date(post.scheduledAt);
      return postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear();
    });
  };

  const stats = {
    total:     posts.length,
    scheduled: posts.filter(p => p.status==='scheduled' || p.status==='approved').length,
    pending:   posts.filter(p => p.status==='pending').length,
    published: posts.filter(p => p.status==='published').length,
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Clock className="animate-spin text-indigo-600" size={40} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-[260px]">
        <Header />
        <main className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Social Calendar</h1>
              <p className="text-slate-500 mt-1">Schedule and manage content across all platforms.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowLibrary(true)} className="bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
                <BookOpen size={18} className="text-indigo-600" />
                Library
              </button>
              <button className="bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
                <Upload size={18} className="text-indigo-600" />
                Bulk Upload
              </button>
              <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                <Plus size={18} />
                New Post
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Posts" value={stats.total} subtext="posts created" icon={<Grid size={20} />} color="slate" />
            <StatCard title="Scheduled" value={stats.scheduled} subtext="upcoming" icon={<Clock size={20} />} color="indigo" />
            <StatCard title="Pending" value={stats.pending} subtext="needs approval" icon={<AlertCircle size={20} />} color="amber" />
            <StatCard title="Published" value={stats.published} subtext="this month" icon={<CheckCircle size={20} />} color="emerald" />
          </div>

          {/* View Switcher & Filters */}
          <div className="flex justify-between items-center mb-6">
            <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
              <ViewTab active={view === 'month'} onClick={() => setView('month')} icon={<Calendar size={16} />} label="Month" />
              <ViewTab active={view === 'week'} onClick={() => setView('week')} icon={<Grid size={16} />} label="Week" />
              <ViewTab active={view === 'list'} onClick={() => setView('list')} icon={<List size={16} />} label="List" />
              <ViewTab active={view === 'approval'} onClick={() => setView('approval')} icon={<Check size={16} />} label="Approval Queue" />
            </div>

            <div className="flex gap-2">
              {['all', 'meta', 'tiktok', 'linkedin', 'instagram'].map(p => (
                <button
                  key={p}
                  onClick={() => setActiveFilter(p)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                    activeFilter === p ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-100 hover:border-slate-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {view === 'month' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()-1)))} className="p-2 hover:bg-slate-50 rounded-lg">
                      <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 text-xs font-bold bg-slate-50 rounded-lg hover:bg-slate-100">Today</button>
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()+1)))} className="p-2 hover:bg-slate-50 rounded-lg">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 border-t border-l border-slate-100">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-3 text-center text-xs font-black text-slate-400 uppercase tracking-widest border-r border-b border-slate-100 bg-slate-50/50">
                      {day}
                    </div>
                  ))}
                  {getDaysInMonth(currentDate).map((day, idx) => {
                    const dayPosts = getPostsForDay(day);
                    const isToday = day && day.toDateString() === new Date().toDateString();
                    return (
                      <div key={idx} className={`min-h-[120px] p-2 border-r border-b border-slate-100 relative group transition-colors ${!day ? 'bg-slate-50/20' : 'hover:bg-slate-50/40'}`}>
                        {day && (
                          <>
                            <div className={`text-sm font-bold mb-2 flex items-center justify-center w-7 h-7 rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>
                              {day.getDate()}
                            </div>
                            <div className="space-y-1">
                              {dayPosts.slice(0, 3).map(post => (
                                <button
                                  key={post.id}
                                  onClick={() => setSelectedPost(post)}
                                  className={`w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold truncate flex items-center gap-1.5 transition-all hover:scale-[1.02] ${
                                    post.status === 'scheduled' || post.status === 'approved' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                    post.status === 'published' ? 'bg-slate-100 text-slate-600' :
                                    post.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                    'bg-white border border-slate-100 text-slate-500'
                                  }`}
                                >
                                  <PlatformBadge platform={(Array.isArray(post.platforms) ? post.platforms[0] : JSON.parse(post.platforms || '[]')[0]) || 'meta'} />
                                  {post.title}
                                </button>
                              ))}
                              {dayPosts.length > 3 && (
                                <div className="text-[9px] font-black text-slate-400 pl-2">
                                  + {dayPosts.length - 3} more
                                </div>
                              )}
                            </div>
                            <button 
                              onClick={() => {
                                setForm({...form, scheduledDate: day.toISOString().split('T')[0]});
                                setShowCreateModal(true);
                              }}
                              className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100"
                            >
                              <Plus size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {view === 'list' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Title</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Platforms</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Scheduled At</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Array.isArray(filteredPosts) && filteredPosts.map(post => {
                      const platforms = Array.isArray(post.platforms) ? post.platforms : JSON.parse(post.platforms || '[]');
                      return (
                        <tr key={post.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 font-bold text-slate-900">{post.title}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1.5">
                              {platforms.map((p: string) => <PlatformBadge key={p} platform={p} />)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : 'Not set'}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={post.status} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setSelectedPost(post)} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600"><Eye size={16} /></button>
                              <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600"><Edit size={16} /></button>
                              <button onClick={() => handleDelete(post.id)} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {view === 'approval' && (
              <div className="p-8">
                {posts.filter(p => p.status === 'pending').length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Check size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">All caught up!</h3>
                    <p className="text-slate-500 mt-2">No posts waiting for approval at the moment.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {posts.filter(p => p.status === 'pending').map(post => {
                      const platforms = Array.isArray(post.platforms) ? post.platforms : JSON.parse(post.platforms || '[]');
                      return (
                        <div key={post.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-1.5">
                              {platforms.map((p: string) => <PlatformBadge key={p} platform={p} />)}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submitted Recently</span>
                          </div>
                          <h4 className="text-lg font-bold text-slate-900 mb-2">{post.title}</h4>
                          <p className="text-slate-600 text-sm mb-4 line-clamp-3">"{post.content}"</p>
                          <div className="bg-slate-50 p-4 rounded-2xl mb-6">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2">
                              <Calendar size={14} />
                              Scheduled: {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : 'Manual'}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                              <CheckCircle size={14} />
                              By: Team Member
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => {
                                const reason = prompt('Reason for rejection?');
                                if (reason) handleReject(post.id, reason);
                              }}
                              className="flex-1 py-2.5 rounded-xl border border-rose-200 text-rose-600 font-bold text-sm hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                            >
                              <X size={16} /> Reject
                            </button>
                            <button 
                              onClick={() => handleApprove(post.id)}
                              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                            >
                              <Check size={16} /> Approve
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Create New Post</h2>
                <p className="text-slate-500 text-sm">Schedule content across multiple channels.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white rounded-full transition-colors border border-slate-100 shadow-sm">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Title</label>
                <input 
                  type="text" 
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  placeholder="Enter campaign title..."
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Content</label>
                <textarea 
                  value={form.content}
                  onChange={(e) => setForm({...form, content: e.target.value})}
                  rows={4}
                  placeholder="Write your amazing caption here..."
                  className="w-full px-5 py-4 rounded-3xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-slate-900 resize-none"
                />
                <div className={`text-right mt-1 text-[10px] font-bold ${form.content.length > 2000 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {form.content.length}/2200 characters
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {['meta', 'instagram', 'tiktok', 'linkedin', 'youtube', 'x'].map(p => {
                    const isSelected = form.platforms.includes(p);
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          const newPlatforms = isSelected ? form.platforms.filter(x => x !== p) : [...form.platforms, p];
                          setForm({...form, platforms: newPlatforms});
                        }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all border ${
                          isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected ? <Check size={14} /> : PLATFORM_CONFIG[p]?.icon || <Plus size={14} />}
                        {PLATFORM_CONFIG[p]?.label || p}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Date</label>
                  <input 
                    type="date" 
                    value={form.scheduledDate}
                    onChange={(e) => setForm({...form, scheduledDate: e.target.value})}
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Time</label>
                  <input 
                    type="time" 
                    value={form.scheduledTime}
                    onChange={(e) => setForm({...form, scheduledTime: e.target.value})}
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded-3xl border border-indigo-100 flex items-start gap-4">
                <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-900">Best Time Suggestion</p>
                  <p className="text-sm text-indigo-700 mt-0.5">💡 Peak engagement for Meta: <strong>Wednesday 11:00 AM</strong> (Score: 9.2)</p>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button onClick={() => setShowCreateModal(false)} className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-white transition-all">Cancel</button>
              <button onClick={() => handleCreatePost('draft')} className="px-6 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-sm">Save Draft</button>
              <button onClick={() => handleCreatePost('pending')} className="px-8 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">Submit for Approval</button>
            </div>
          </div>
        </div>
      )}

      {/* Library Side Panel */}
      {showLibrary && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowLibrary(false)} />
          <div className="relative w-full max-w-md bg-white h-screen shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">Content Library</h2>
              <button onClick={() => setShowLibrary(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {library.map((item) => (
                <div key={item.id} className="p-5 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider">{item.type}</span>
                    <span className="text-[10px] font-bold text-slate-400">Used {item.usageCount} times</span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">{item.name}</h4>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-3 italic">"{item.content}"</p>
                  <button 
                    onClick={() => {
                      setForm({...form, content: item.content});
                      setShowCreateModal(true);
                      setShowLibrary(false);
                      toast.success('Template applied!');
                    }}
                    className="w-full py-2.5 bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Send size={14} /> Use It
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl relative">
            <button onClick={() => setSelectedPost(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full"><X size={24} /></button>
            
            <div className="flex items-center gap-3 mb-6">
              <StatusBadge status={selectedPost.status} />
              <div className="flex gap-1.5">
                {(Array.isArray(selectedPost.platforms) ? selectedPost.platforms : JSON.parse(selectedPost.platforms || '[]')).map((p: string) => <PlatformBadge key={p} platform={p} />)}
              </div>
            </div>

            <h2 className="text-3xl font-black text-slate-900 mb-4">{selectedPost.title}</h2>
            <div className="p-6 bg-slate-50 rounded-[32px] mb-8 relative">
              <MessageSquare className="absolute -top-2 -left-2 text-indigo-200" size={32} />
              <p className="text-slate-700 leading-relaxed font-medium">"{selectedPost.content}"</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8 border-y border-slate-100 py-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Scheduled At</p>
                <p className="font-bold text-slate-700 flex items-center gap-2">
                  <Calendar size={14} className="text-indigo-600" />
                  {selectedPost.scheduledAt ? new Date(selectedPost.scheduledAt).toLocaleString() : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Created By</p>
                <p className="font-bold text-slate-700 flex items-center gap-2">
                  <CheckCircle size={14} className="text-indigo-600" />
                  Team Hub
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              {['draft', 'pending', 'rejected'].includes(selectedPost.status) && (
                <button className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100">Submit Approval</button>
              )}
              <button onClick={() => handleDelete(selectedPost.id)} className="flex-1 py-3.5 bg-rose-50 text-rose-600 rounded-2xl font-bold border border-rose-100">Delete Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, subtext, icon, color }: any) {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600',
    amber:  'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    slate:   'bg-slate-50 text-slate-600',
  };
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <h2 className="text-3xl font-black text-slate-900">{value}</h2>
        <span className="text-xs font-bold text-slate-400 lowercase">{subtext}</span>
      </div>
    </div>
  );
}

function ViewTab({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
        active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function getDemoPostsFallback() {
  const now = new Date();
  return [
    { id:'fp-1', title:'Summer Campaign', content:'🌟 Summer deals are here! Don\'t miss our limited time offer.', platforms:['meta','instagram'], status:'scheduled', scheduledAt: new Date(now.getTime()+2*86400000).toISOString() },
    { id:'fp-2', title:'Product Launch', content:'🚀 Introducing our new AI-powered analytics feature!', platforms:['tiktok','linkedin'], status:'pending', scheduledAt: new Date(now.getTime()+4*86400000).toISOString() },
    { id:'fp-3', title:'Success Story', content:'💪 How one client achieved 3x ROAS in just 30 days!', platforms:['linkedin','meta'], status:'approved', scheduledAt: new Date(now.getTime()+6*86400000).toISOString() },
    { id:'fp-4', title:'Weekend Post', content:'🎉 Happy weekend everyone! What are your plans?', platforms:['meta','instagram','tiktok'], status:'draft', scheduledAt: new Date(now.getTime()+8*86400000).toISOString() },
    { id:'fp-5', title:'Tips Thread', content:'📊 5 marketing tips for better ROI in 2026', platforms:['linkedin'], status:'published', scheduledAt: new Date(now.getTime()-2*86400000).toISOString() },
  ];
}

function getDemoLibraryFallback() {
  return [
    { id: 'lib-1', name: 'Summer Sale Template', type: 'template', content: '🌟 Summer Sale is here! Get [X]% off on all products. Use code SUMMER[YEAR].', usageCount: 12 },
    { id: 'lib-2', name: 'Product Launch Template', type: 'template', content: '🚀 Exciting news! We just launched [PRODUCT NAME]. Here is what makes it special...', usageCount: 8 },
    { id: 'lib-3', name: 'Engagement Question', type: 'caption', content: '💬 Quick question for our community: [QUESTION]? Drop your answer below!', usageCount: 23 },
    { id: 'lib-4', name: 'Marketing Hashtag Set', type: 'hashtag_set', content: '#marketing #seo #branding #digitalmarketing', usageCount: 45 },
  ];
}
