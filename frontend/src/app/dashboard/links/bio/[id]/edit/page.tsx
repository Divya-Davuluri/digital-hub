'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, GripVertical, Plus, ExternalLink, Link as LinkIcon, Camera, MessageCircle, Users, Video, Globe, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BioPageEditor({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState<any>(null);

  const icons: any = {
    website: <Globe size={18} />,
    instagram: <Camera size={18} />,
    twitter: <MessageCircle size={18} />,
    facebook: <Users size={18} />,
    youtube: <Video size={18} />,
    tiktok: <Smartphone size={18} />,
    other: <LinkIcon size={18} />
  };

  useEffect(() => {
    fetchPage();
  }, [params.id]);

  const fetchPage = async () => {
    try {
      const res = await fetch(`/api/links/bio-pages/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setPage(data.data);
      } else {
        toast.error('Failed to load bio page');
        router.push('/dashboard/links');
      }
    } catch (err) {
      toast.error('Error loading bio page');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/links/bio-pages/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: page.title,
          description: page.description,
          backgroundColor: page.backgroundColor,
          buttonStyle: page.buttonStyle,
          buttonColor: page.buttonColor,
          buttonTextColor: page.buttonTextColor,
          links: page.links,
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Bio page saved successfully!');
      } else {
        toast.error(data.message || 'Failed to save');
      }
    } catch (err) {
      toast.error('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => {
    const newLink = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Link',
      url: 'https://',
      type: 'website',
      isActive: true,
      clicks: 0
    };
    setPage({ ...page, links: [...(page.links || []), newLink] });
  };

  const updateLink = (id: string, field: string, value: any) => {
    const newLinks = page.links.map((l: any) => l.id === id ? { ...l, [field]: value } : l);
    setPage({ ...page, links: newLinks });
  };

  const deleteLink = (id: string) => {
    setPage({ ...page, links: page.links.filter((l: any) => l.id !== id) });
  };

  const moveLink = (index: number, direction: 'up' | 'down') => {
    const newLinks = [...page.links];
    if (direction === 'up' && index > 0) {
      [newLinks[index - 1], newLinks[index]] = [newLinks[index], newLinks[index - 1]];
    } else if (direction === 'down' && index < newLinks.length - 1) {
      [newLinks[index + 1], newLinks[index]] = [newLinks[index], newLinks[index + 1]];
    }
    setPage({ ...page, links: newLinks });
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!page) return <div className="p-8 text-center text-slate-500">Page not found</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard/links')} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Edit Bio Page</h1>
            <a href={`/bio/${page.slug}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold text-sm flex items-center gap-1 hover:underline">
              {typeof window !== 'undefined' ? window.location.host : 'hub.link'}/bio/{page.slug} <ExternalLink size={12} />
            </a>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
        >
          <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-8 flex-1 min-h-0">
        {/* Editor Settings (Left) */}
        <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-y-auto p-8 custom-scrollbar">
          <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            🎨 Appearance
          </h2>
          
          <div className="space-y-6 mb-10">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Page Title</label>
              <input 
                type="text" 
                value={page.title}
                onChange={(e) => setPage({ ...page, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
              <textarea 
                value={page.description || ''}
                onChange={(e) => setPage({ ...page, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none font-medium resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Background Color</label>
                <div className="flex gap-3">
                  <input 
                    type="color" 
                    value={page.backgroundColor || '#111827'}
                    onChange={(e) => setPage({ ...page, backgroundColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 overflow-hidden"
                  />
                  <input type="text" value={page.backgroundColor || '#111827'} onChange={(e) => setPage({ ...page, backgroundColor: e.target.value })} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Button Style</label>
                <select 
                  value={page.buttonStyle || 'rounded'}
                  onChange={(e) => setPage({ ...page, buttonStyle: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 font-bold text-sm"
                >
                  <option value="rounded">Rounded</option>
                  <option value="pill">Pill</option>
                  <option value="square">Square</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              🔗 Links & Buttons
            </h2>
            <button 
              onClick={addLink}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800"
            >
              <Plus size={14} /> Add Link
            </button>
          </div>

          <div className="space-y-4">
            {page.links?.length === 0 && (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-2xl text-slate-400 font-medium">
                No links added yet.
              </div>
            )}
            {page.links?.map((link: any, index: number) => (
              <div key={link.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 shadow-sm group">
                <div className="flex flex-col gap-1 items-center justify-center text-slate-300">
                  <button onClick={() => moveLink(index, 'up')} disabled={index === 0} className="hover:text-slate-600 disabled:opacity-30"><GripVertical size={16} /></button>
                  <button onClick={() => moveLink(index, 'down')} disabled={index === page.links.length - 1} className="hover:text-slate-600 disabled:opacity-30"><GripVertical size={16} /></button>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={link.title}
                      onChange={(e) => updateLink(link.id, 'title', e.target.value)}
                      placeholder="Link Title"
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg font-bold text-sm"
                    />
                    <select
                      value={link.type}
                      onChange={(e) => updateLink(link.id, 'type', e.target.value)}
                      className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium"
                    >
                      <option value="website">Website</option>
                      <option value="instagram">Instagram</option>
                      <option value="twitter">Twitter</option>
                      <option value="facebook">Facebook</option>
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {icons[link.type] || <LinkIcon size={16} />}
                      </span>
                      <input 
                        type="url" 
                        value={link.url}
                        onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                        placeholder="https://"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-between items-end">
                  <button 
                    onClick={() => updateLink(link.id, 'isActive', !link.isActive)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${link.isActive ? 'bg-indigo-500' : 'bg-slate-200'}`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${link.isActive ? 'left-[22px]' : 'left-[3px]'}`} />
                  </button>
                  <button onClick={() => deleteLink(link.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Preview (Right) */}
        <div className="w-[400px] shrink-0 flex items-center justify-center bg-slate-100 rounded-[32px] overflow-hidden border border-slate-200 relative p-6">
          <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-black text-slate-600 tracking-widest uppercase shadow-sm">
            Live Preview
          </div>
          
          {/* Mobile Frame */}
          <div className="w-[320px] h-[650px] bg-black rounded-[48px] p-2 shadow-2xl relative border-4 border-slate-800">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20"></div>
            
            <div 
              className="w-full h-full rounded-[40px] overflow-y-auto relative custom-scrollbar flex flex-col"
              style={{ backgroundColor: page.backgroundColor || '#111827' }}
            >
              <div className="flex-1 p-6 flex flex-col items-center">
                <div className="w-20 h-20 bg-white/20 rounded-full mb-4 flex items-center justify-center text-2xl border-2 border-white/30 backdrop-blur-sm">
                  {page.title?.charAt(0) || 'P'}
                </div>
                <h1 className="text-xl font-bold text-white text-center mb-2" style={{ fontFamily: 'Inter' }}>
                  {page.title || 'Your Name'}
                </h1>
                <p className="text-white/70 text-sm text-center mb-8 font-medium">
                  {page.description || 'Welcome to my page'}
                </p>

                <div className="w-full space-y-3">
                  {page.links?.filter((l:any)=>l.isActive).map((link: any) => (
                    <div 
                      key={link.id} 
                      className="w-full flex items-center gap-3 p-3 bg-white hover:bg-white/90 transition-all cursor-default shadow-sm"
                      style={{
                        borderRadius: page.buttonStyle === 'pill' ? '999px' : page.buttonStyle === 'square' ? '8px' : '16px',
                        backgroundColor: page.buttonColor || '#ffffff',
                        color: page.buttonTextColor || '#000000'
                      }}
                    >
                      <div className="opacity-70">
                        {icons[link.type] || <LinkIcon size={18} />}
                      </div>
                      <span className="font-bold flex-1 text-center pr-6 text-sm">
                        {link.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                  Powered by HubSaaS
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
      `}} />
    </div>
  );
}
