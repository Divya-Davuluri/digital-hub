'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Plus, Search, Filter, MoreHorizontal, Image as ImageIcon, 
  Video, FileText, Download, Trash2, Eye, Grid, List, Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiCall from '@/lib/api';

interface Creative {
  id: string;
  name: string;
  type: string;
  file_url: string;
  file_type?: string;
  size?: string;
  category?: string;
  created_at: string;
}

export default function CreativeLibrary() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/assets');
      if (data.success) {
        setCreatives(data.assets || []);
      }
    } catch (err) {
      console.error('Load assets error:', err);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Read file as Base64 for persistence
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        
        try {
          toast.loading('Uploading asset...', { id: 'upload' });
          
          const isVideo = file.type.includes('video');
          const res = await apiCall('/assets/upload', {
            method: 'POST',
            body: JSON.stringify({
              name: file.name,
              fileType: isVideo ? 'video' : 'image',
              size: Math.round(file.size / 1024), // in KB
              fileUrl: base64Data,
              category: 'General'
            })
          });

          if (res.success) {
            setCreatives([res.asset, ...creatives]);
            toast.success('Asset persisted to database!', { id: 'upload' });
          } else {
            throw new Error(res.message);
          }
        } catch (err: any) {
          console.error('Upload error:', err);
          toast.error(`Upload failed: ${err.message}`, { id: 'upload' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await apiCall(`/assets/${id}`, { method: 'DELETE' });
      if (res.success) {
        setCreatives(creatives.filter(c => c.id !== id));
        toast.success('Asset removed from database');
      }
    } catch (err) {
      toast.error('Failed to delete asset');
    }
  };

  const handleView = (asset: any) => {
    const win = window.open();
    if (win) {
      if (asset.file_type === 'image') {
        win.document.write(`<img src="${asset.file_url}" style="max-width:100%">`);
      } else if (asset.file_type === 'video') {
        win.document.write(`<video src="${asset.file_url}" controls style="max-width:100%"></video>`);
      }
    }
  };

  const filteredCreatives = creatives.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <div>
          <h3 className="text-lg font-black text-slate-900">Creative Asset Library</h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Permanent Storage & Management</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,video/*"
          />
          <button onClick={() => setView('grid')} className={`p-2 rounded-lg ${view === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><Grid size={18} /></button>
          <button onClick={() => setView('list')} className={`p-2 rounded-lg ${view === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><List size={18} /></button>
          <button 
            onClick={handleUploadClick}
            className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Upload size={16} /> Upload New Asset
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-slate-50 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search persisted assets..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="text-center py-20 text-slate-400 italic">Synchronizing assets from database...</div>
        ) : filteredCreatives.length === 0 ? (
          <div className="text-center py-20">
             <div className="text-4xl mb-4">🖼️</div>
             <p className="text-slate-400 text-sm italic">No creative assets found. Upload one to get started.</p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCreatives.map((asset) => (
              <div key={asset.id} className="group relative bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden hover:border-indigo-200 hover:shadow-xl transition-all">
                <div className="aspect-square w-full bg-slate-200 overflow-hidden flex items-center justify-center">
                  {asset.type === 'image' || asset.file_type === 'image' ? (
                    <img src={asset.file_url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center bg-slate-900 text-white">
                        <Video size={32} />
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="text-sm font-bold text-slate-900 mb-1 truncate">{asset.name}</div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>{asset.type || asset.file_type}</span>
                    <span>{asset.size ? `${asset.size} KB` : ''}</span>
                  </div>
                </div>

                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <button 
                    onClick={() => handleView(asset)}
                    className="p-2 bg-white/90 backdrop-blur rounded-lg text-slate-600 hover:text-indigo-600 shadow-lg hover:scale-110 transition-all"
                  >
                    <Eye size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(asset.id)}
                    className="p-2 bg-white/90 backdrop-blur rounded-lg text-slate-600 hover:text-red-600 shadow-lg hover:scale-110 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCreatives.map((asset) => (
              <div key={asset.id} className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                   {(asset.type === 'image' || asset.file_type === 'image') ? (
                     <img src={asset.file_url} alt={asset.name} className="w-full h-full object-cover" />
                   ) : <Video size={20} className="text-slate-400" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-900">{asset.name}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {new Date(asset.created_at).toLocaleDateString()} • {asset.size} KB
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleView(asset)}
                    className="p-2 text-slate-400 hover:text-indigo-600"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(asset.id)}
                    className="p-2 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
