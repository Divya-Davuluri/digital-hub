'use client';

import { useState } from 'react';
import { 
  Plus, Search, Filter, MoreHorizontal, Image as ImageIcon, 
  Video, FileText, Download, Trash2, Eye, Grid, List
} from 'lucide-react';

const MOCK_CREATIVES = [
  { id: '1', name: 'Summer Banner 1', type: 'image', url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop', size: '1.2 MB', dimensions: '1080x1080', date: '2026-05-10' },
  { id: '2', name: 'Product Video Intro', type: 'video', url: '#', size: '45 MB', duration: '0:15', date: '2026-05-09' },
  { id: '3', name: 'Lifestyle Photo B', type: 'image', url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop', size: '2.4 MB', dimensions: '1920x1080', date: '2026-05-08' },
  { id: '4', name: 'Retargeting Ad Copy', type: 'text', content: 'Special offer just for you!', date: '2026-05-07' },
];

export default function CreativeLibrary() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <div>
          <h3 className="text-lg font-black text-slate-900">Creative Library</h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Manage ad assets</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('grid')} className={`p-2 rounded-lg ${view === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><Grid size={18} /></button>
          <button onClick={() => setView('list')} className={`p-2 rounded-lg ${view === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><List size={18} /></button>
          <button className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
            <Plus size={16} /> Upload Asset
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-slate-50 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search assets..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <button className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 flex items-center gap-2">
          <Filter size={16} /> Filter
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {view === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {MOCK_CREATIVES.map((asset) => (
              <div key={asset.id} className="group relative bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden hover:border-indigo-200 hover:shadow-xl transition-all">
                <div className="aspect-square w-full bg-slate-200 overflow-hidden flex items-center justify-center">
                  {asset.type === 'image' ? (
                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : asset.type === 'video' ? (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Video size={32} />
                      <span className="text-[10px] font-bold">{asset.duration}</span>
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <FileText size={32} className="mx-auto text-slate-400 mb-2" />
                      <p className="text-[10px] text-slate-500 line-clamp-2">{asset.content}</p>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="text-sm font-bold text-slate-900 mb-1 truncate">{asset.name}</div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>{asset.type}</span>
                    <span>{asset.size || asset.dimensions}</span>
                  </div>
                </div>

                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-white/90 backdrop-blur rounded-lg text-slate-600 hover:text-indigo-600 shadow-lg"><Eye size={14} /></button>
                  <button className="p-2 bg-white/90 backdrop-blur rounded-lg text-slate-600 hover:text-red-600 shadow-lg"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {MOCK_CREATIVES.map((asset) => (
              <div key={asset.id} className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {asset.type === 'image' ? <img src={asset.url} className="w-full h-full object-cover" /> : <Video size={20} className="text-slate-400" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-900">{asset.name}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{asset.date} • {asset.size}</div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-slate-900"><Download size={18} /></button>
                  <button className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
