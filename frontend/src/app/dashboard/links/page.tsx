'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import toast from 'react-hot-toast';
import {
  Link as LinkIcon, Plus, ExternalLink, Copy, QrCode,
  BarChart2, Trash2, Edit, Globe, Eye,
  MousePointer, TrendingUp, Share2, X, ChevronRight,
  Monitor, Smartphone, Tablet, Users
} from 'lucide-react';

const getLinksArray = (links: any): any[] => {
  if (!links) return [];
  if (Array.isArray(links)) return links;
  if (typeof links === 'string') {
    try { return JSON.parse(links); }
    catch { return []; }
  }
  return [];
};

export default function LinksPage() {
  const [activeTab, setActiveTab] = useState<'bio-pages' | 'short-links'>('bio-pages');
  const [bioPages, setBioPages] = useState<any[]>([]);
  const [shortLinks, setShortLinks] = useState<any[]>([]);
  const [showCreateBio, setShowCreateBio] = useState(false);
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [showQRModal, setShowQRModal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newBio, setNewBio] = useState({
    title: '', slug: '', description: '', backgroundColor: '#6366f1', buttonStyle: 'rounded', links: [] as any[]
  });
  const [newLink, setNewLink] = useState({
    title: '', originalUrl: '', customAlias: '', campaignName: '', metaPixelId: '', tiktokPixelId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const bioRes = await apiCall('/links/bio-pages');
      const bioData = bioRes?.data || bioRes || [];
      setBioPages(Array.isArray(bioData) ? bioData : []);

      const linkRes = await apiCall('/links/short');
      const linkData = linkRes?.data || linkRes || [];
      setShortLinks(Array.isArray(linkData) ? linkData : []);
    } catch (err) {
      setBioPages(getDemoBioPagesFallback());
      setShortLinks(getDemoShortLinksFallback());
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBio = async () => {
    if (!newBio.title.trim()) return toast.error('Title is required');
    try {
      await apiCall('/links/bio-pages', {
        method: 'POST',
        body: JSON.stringify(newBio)
      });
      toast.success('Bio page created!');
      setShowCreateBio(false);
      loadData();
    } catch (err) {
      toast.error('Failed to create bio page');
    }
  };

  const handleCreateLink = async () => {
    if (!newLink.title.trim() || !newLink.originalUrl.trim()) return toast.error('Title and URL required');
    try {
      await apiCall('/links/short', {
        method: 'POST',
        body: JSON.stringify(newLink)
      });
      toast.success('Short link created!');
      setShowCreateLink(false);
      loadData();
    } catch (err) {
      toast.error('Failed to create short link');
    }
  };

  const handleDeleteBio = async (id: string) => {
    if (!confirm('Delete this bio page?')) return;
    try {
      await apiCall(`/links/bio-pages/${id}`, { method: 'DELETE' });
      toast.success('Deleted');
      loadData();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Delete this short link?')) return;
    try {
      await apiCall(`/links/short/${id}`, { method: 'DELETE' });
      toast.success('Deleted');
      loadData();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Link copied!');
  };

  const handleDownloadQR = async (qrUrl: string, title: string) => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${title}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Download failed');
    }
  };

  // Stats calculation
  const bioStats = {
    total: bioPages.length,
    views: bioPages.reduce((s, p) => s + (p.totalViews || 0), 0),
    clicks: bioPages.reduce((s, p) => s + (p.totalClicks || 0), 0),
    top: bioPages.reduce((a, b) => (a.totalViews > b.totalViews ? a : b), { title: 'N/A', totalViews: 0 }).title
  };

  const linkStats = {
    total: shortLinks.length,
    clicks: shortLinks.reduce((s, l) => s + (l.totalClicks || 0), 0),
    unique: shortLinks.reduce((s, l) => s + (l.uniqueClicks || 0), 0),
    top: shortLinks.reduce((a, b) => (a.totalClicks > b.totalClicks ? a : b), { title: 'N/A', totalClicks: 0 }).title
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-[260px]">
        <Header />
        <main className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Link Management</h1>
              <p className="text-slate-500 font-medium mt-1">Manage bio pages and branded short links.</p>
            </div>
            <button 
              onClick={() => activeTab === 'bio-pages' ? setShowCreateBio(true) : setShowCreateLink(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Plus size={20} />
              {activeTab === 'bio-pages' ? 'New Bio Page' : 'New Short Link'}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 border-b border-slate-200 mb-8">
            <button 
              onClick={() => setActiveTab('bio-pages')}
              className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'bio-pages' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              🌐 Bio Pages ({bioPages.length})
              {activeTab === 'bio-pages' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('short-links')}
              className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'short-links' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              🔗 Short Links ({shortLinks.length})
              {activeTab === 'short-links' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full" />}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {activeTab === 'bio-pages' ? (
              <>
                <StatCard title="Total Pages" value={bioStats.total} icon={<Globe size={20} />} color="indigo" />
                <StatCard title="Total Views" value={bioStats.views.toLocaleString()} icon={<Eye size={20} />} color="blue" />
                <StatCard title="Total Clicks" value={bioStats.clicks.toLocaleString()} icon={<MousePointer size={20} />} color="emerald" />
                <StatCard title="Top Page" value={bioStats.top} icon={<TrendingUp size={20} />} color="amber" />
              </>
            ) : (
              <>
                <StatCard title="Total Links" value={linkStats.total} icon={<LinkIcon size={20} />} color="indigo" />
                <StatCard title="Total Clicks" value={linkStats.clicks.toLocaleString()} icon={<MousePointer size={20} />} color="blue" />
                <StatCard title="Unique Clicks" value={linkStats.unique.toLocaleString()} icon={<Users size={20} />} color="emerald" />
                <StatCard title="Top Link" value={linkStats.top} icon={<TrendingUp size={20} />} color="amber" />
              </>
            )}
          </div>

          {/* Content */}
          {activeTab === 'bio-pages' ? (
            <div className="grid grid-cols-2 gap-8">
              {Array.isArray(bioPages) && bioPages.map((page) => (
                <div key={page.id} className="bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-all group border border-slate-100">
                  <div 
                    className="h-32 p-6 flex flex-col justify-end relative overflow-hidden" 
                    style={{ backgroundColor: page.backgroundColor }}
                  >
                    <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => handleDeleteBio(page.id)} className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-rose-500 transition-all"><Trash2 size={16}/></button>
                    </div>
                    <h3 className="text-xl font-black text-white drop-shadow-md">{page.title}</h3>
                    <p className="text-white/80 text-xs font-bold">{page.description}</p>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex gap-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Links</p>
                          <p className="font-black text-slate-900">{getLinksArray(page.links).length}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-100" />
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Views</p>
                          <p className="font-black text-slate-900">{page.totalViews?.toLocaleString()}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-100" />
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Clicks</p>
                          <p className="font-black text-slate-900">{page.totalClicks?.toLocaleString()}</p>
                        </div>
                      </div>
                      <StatusBadge status={page.isPublished ? 'active' : 'draft'} />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                      <span className="text-xs font-bold text-slate-500 truncate mr-4">dmhub.link/{page.slug}</span>
                      <button 
                        onClick={() => copyToClipboard(`${window.location.origin}/bio/${page.slug}`)}
                        className="p-2 hover:bg-white rounded-xl text-indigo-600 transition-all"
                      >
                        <Copy size={16} />
                      </button>
                    </div>

                    <div className="flex gap-3">
                      <a 
                        href={`/bio/${page.slug}`} 
                        target="_blank"
                        className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                      >
                        <Eye size={14} /> Preview
                      </a>
                      <button 
                        onClick={() => toast.success('Edit Page feature coming soon!')}
                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                      >
                        <Edit size={14} /> Edit Page
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Link Title</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Short URL</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Original URL</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clicks</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">QR</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {Array.isArray(shortLinks) && shortLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <p className="font-bold text-slate-900">{link.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{link.campaignName || 'No Campaign'}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-600">hub.link/{link.shortCode}</span>
                          <button 
                            onClick={() => copyToClipboard(`${window.location.origin}/l/${link.shortCode}`)}
                            className="p-1.5 hover:bg-white border border-transparent hover:border-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs text-slate-400 font-medium truncate max-w-[150px]">{link.originalUrl}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900">{link.totalClicks || 0}</span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500" 
                              style={{ width: `${Math.min((link.totalClicks / 5000) * 100, 100)}%` }} 
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <button 
                          onClick={() => setShowQRModal(link)}
                          className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-white hover:text-indigo-600 transition-all group"
                        >
                          <QrCode size={18} className="group-hover:scale-110 transition-transform" />
                        </button>
                      </td>
                      <td className="px-8 py-5">
                        <StatusBadge status={link.isActive ? 'active' : 'paused'} />
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => toast.success('Edit Link feature coming soon!')}
                            className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 border border-transparent hover:border-slate-100 transition-all"
                          >
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDeleteLink(link.id)} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-rose-600 border border-transparent hover:border-slate-100 transition-all"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Create Bio Modal */}
      {showCreateBio && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
            <button onClick={() => setShowCreateBio(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full"><X size={24} /></button>
            <h2 className="text-3xl font-black text-slate-900 mb-2">New Bio Page</h2>
            <p className="text-slate-500 mb-8 font-medium">Create a Linktree-style landing page for your brand.</p>
            
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Page Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Nike Marketing"
                    value={newBio.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                      setNewBio({ ...newBio, title, slug });
                    }}
                    className="w-full px-6 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Slug</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">hub.link/</span>
                    <input 
                      type="text" 
                      value={newBio.slug}
                      onChange={(e) => setNewBio({ ...newBio, slug: e.target.value })}
                      className="w-full pl-24 pr-6 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                  <textarea 
                    placeholder="Short bio..."
                    value={newBio.description}
                    onChange={(e) => setNewBio({ ...newBio, description: e.target.value })}
                    rows={2}
                    className="w-full px-6 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium text-slate-900 resize-none"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Background Color</label>
                  <div className="flex gap-3">
                    <input 
                      type="color" 
                      value={newBio.backgroundColor}
                      onChange={(e) => setNewBio({ ...newBio, backgroundColor: e.target.value })}
                      className="w-12 h-12 rounded-xl cursor-pointer border-none p-0 overflow-hidden"
                    />
                    <div className="flex gap-1.5 flex-1 items-center">
                      {['#111827', '#6366f1', '#ec4899', '#10b981', '#f59e0b'].map(c => (
                        <button 
                          key={c}
                          onClick={() => setNewBio({ ...newBio, backgroundColor: c })}
                          className="w-8 h-8 rounded-lg border-2 border-white shadow-sm transition-transform hover:scale-110"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Button Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['rounded', 'pill', 'square'].map(s => (
                      <button 
                        key={s}
                        onClick={() => setNewBio({ ...newBio, buttonStyle: s })}
                        className={`py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${newBio.buttonStyle === s ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-4">
                   <button 
                    onClick={handleCreateBio}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                   >
                     Create Bio Page <ChevronRight size={18} />
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Link Modal */}
      {showCreateLink && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-10 shadow-2xl relative">
            <button onClick={() => setShowCreateLink(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full"><X size={24} /></button>
            <h2 className="text-3xl font-black text-slate-900 mb-2">New Short Link</h2>
            <p className="text-slate-500 mb-8 font-medium">Create a branded short link for your campaign.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Link Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Summer Sale Campaign"
                  value={newLink.title}
                  onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                  className="w-full px-6 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Destination URL</label>
                <input 
                  type="url" 
                  placeholder="https://your-website.com/offer"
                  value={newLink.originalUrl}
                  onChange={(e) => setNewLink({ ...newLink, originalUrl: e.target.value })}
                  className="w-full px-6 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Custom Alias (Opt)</label>
                  <input 
                    type="text" 
                    placeholder="summer26"
                    value={newLink.customAlias}
                    onChange={(e) => setNewLink({ ...newLink, customAlias: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Campaign Name</label>
                  <input 
                    type="text" 
                    placeholder="Summer 2026"
                    value={newLink.campaignName}
                    onChange={(e) => setNewLink({ ...newLink, campaignName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleCreateLink}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  Create Short Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl text-center relative">
            <button onClick={() => setShowQRModal(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full"><X size={24} /></button>
            <h3 className="text-2xl font-black text-slate-900 mb-1">Link QR Code</h3>
            <p className="text-slate-500 font-medium mb-8 truncate px-4">{showQRModal.title}</p>
            
            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 inline-block mb-8">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/l/${showQRModal.shortCode}`)}`}
                alt="QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <p className="text-sm font-black text-indigo-600 mb-8">hub.link/{showQRModal.shortCode}</p>

            <div className="flex gap-4">
              <button 
                onClick={() => handleDownloadQR(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`${window.location.origin}/l/${showQRModal.shortCode}`)}`, showQRModal.title)}
                className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <QrCode size={18} /> Download
              </button>
              <button 
                onClick={() => copyToClipboard(`${window.location.origin}/l/${showQRModal.shortCode}`)}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              >
                <Copy size={18} /> Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
      <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h2 className="text-2xl font-black text-slate-900">{value}</h2>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    paused: 'bg-amber-50 text-amber-600 border-amber-100',
    draft: 'bg-slate-50 text-slate-400 border-slate-100',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${styles[status]}`}>
      {status === 'active' && <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />}
      {status}
    </span>
  );
}

const getDemoBioPagesFallback = () => ([
  {
    id:'fb-1', slug:'nike-marketing',
    title:'Nike Marketing',
    description:'Official links for Nike Marketing',
    backgroundColor:'#111827',
    buttonStyle:'rounded',
    buttonColor:'#ffffff',
    buttonTextColor:'#000000',
    totalClicks:1234, totalViews:5678,
    isPublished:true,
    links:[
      {id:'l1',title:'🌐 Official Website', url:'https://nike.com',type:'website',clicks:456},
      {id:'l2',title:'📸 Instagram', url:'https://instagram.com/nike', type:'instagram',clicks:389},
      {id:'l3',title:'🎵 TikTok', url:'https://tiktok.com/@nike', type:'tiktok',clicks:234},
    ],
    createdAt:new Date(Date.now()-30*86400000).toISOString(),
  },
  {
    id:'fb-2', slug:'amazon-cart',
    title:'Amazon Cart Deals',
    description:'Best deals and offers',
    backgroundColor:'#FF9900',
    buttonStyle:'pill',
    buttonColor:'#232F3E',
    buttonTextColor:'#ffffff',
    totalClicks:891, totalViews:3456,
    isPublished:true,
    links:[
      {id:'l4',title:'🛒 Shop All Deals', url:'https://amazon.com/deals', type:'shop',clicks:445},
      {id:'l5',title:'⚡ Lightning Deals', url:'https://amazon.com/lightning', type:'website',clicks:289},
    ],
    createdAt:new Date(Date.now()-20*86400000).toISOString(),
  },
]);

const getDemoShortLinksFallback = () => ([
  {
    id:'fs-1',title:'Summer Sale Campaign',
    originalUrl:'https://nike.com/summer-sale-2026',
    shortCode:'summer26',customAlias:'summer26',
    campaignName:'Summer 2026',
    totalClicks:2341,uniqueClicks:1876,isActive:true,
    qrCodeUrl:'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://digital-hub-1.onrender.com/l/summer26',
    createdAt:new Date(Date.now()-15*86400000).toISOString(),
  },
  {
    id:'fs-2',title:'Product Launch Link',
    originalUrl:'https://nike.com/new-arrivals',
    shortCode:'launch26',customAlias:'launch26',
    campaignName:'Product Launch',
    totalClicks:1567,uniqueClicks:1234,isActive:true,
    qrCodeUrl:'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://digital-hub-1.onrender.com/l/launch26',
    createdAt:new Date(Date.now()-10*86400000).toISOString(),
  },
  {
    id:'fs-3',title:'Instagram Bio Link',
    originalUrl:'https://instagram.com/nikemkt',
    shortCode:'igbio',customAlias:'igbio',
    campaignName:'Social Media',
    totalClicks:987,uniqueClicks:756,isActive:true,
    qrCodeUrl:'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://digital-hub-1.onrender.com/l/igbio',
    createdAt:new Date(Date.now()-5*86400000).toISOString(),
  },
  {
    id:'fs-4',title:'TikTok Campaign',
    originalUrl:'https://tiktok.com/@nike/latest',
    shortCode:'ttvid',customAlias:'ttvid',
    campaignName:'TikTok Growth',
    totalClicks:3456,uniqueClicks:2890,isActive:true,
    qrCodeUrl:'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://digital-hub-1.onrender.com/l/ttvid',
    createdAt:new Date(Date.now()-3*86400000).toISOString(),
  },
]);
