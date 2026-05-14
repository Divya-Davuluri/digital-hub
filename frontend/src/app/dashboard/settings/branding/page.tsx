'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import RoleGuard from '@/components/RoleGuard';
import { apiCall } from '@/lib/api';
import { 
  Palette, Globe, Image as ImageIcon, Shield, 
  ExternalLink, Save, CheckCircle2, AlertCircle,
  Type, Layout, Code, HelpCircle, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function BrandingSettingsPage() {
  const [branding, setBranding] = useState({
    agencyName: '',
    primaryColor: '#6366f1',
    secondaryColor: '#4f46e5',
    logoUrl: '',
    faviconUrl: '',
    customCss: '',
    footerText: '',
    supportEmail: '',
    removePoweredBy: 0
  });

  const [domains, setDomains] = useState<any[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bData, dData] = await Promise.all([
          apiCall('/branding'),
          apiCall('/branding/domain')
        ]);
        setBranding({
          agencyName:      bData.agencyName || '',
          primaryColor:    bData.primaryColor || '#6366f1',
          secondaryColor:  bData.secondaryColor || '#4f46e5',
          logoUrl:         bData.logoUrl || '',
          faviconUrl:      bData.faviconUrl || '',
          customCss:       bData.customCss || '',
          footerText:      bData.footerText || '',
          supportEmail:    bData.supportEmail || '',
          removePoweredBy: bData.removePoweredBy || 0,
        });
        setDomains(dData);
      } catch (err) {
        console.error("Failed to load branding data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiCall('/branding', {
        method: 'POST',
        body: JSON.stringify(branding)
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Failed to save branding");
    } finally {
      setSaving(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain) return;
    try {
      await apiCall('/branding/domain', {
        method: 'POST',
        body: JSON.stringify({ domain: newDomain })
      });
      setNewDomain('');
      toast.success("Domain added!");
      // Refresh domains
      const dData = await apiCall('/branding/domain');
      setDomains(dData);
    } catch (err) {
      toast.error("Failed to add domain");
    }
  };

  const handleDeleteDomain = async (id: string) => {
    try {
      await apiCall(`/branding/domain/${id}`, { method: 'DELETE' });
      toast.success("Domain removed");
      setDomains(domains.filter(d => d.id !== id));
    } catch (err) {
      toast.error("Failed to delete domain");
    }
  };

  const handleFileUpload = async (type: 'logo' | 'favicon') => {
    const file = type === 'logo' ? logoInputRef.current?.files?.[0] : faviconInputRef.current?.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    const uploadToast = toast.loading(`Uploading ${type}...`);
    try {
      const token = localStorage.getItem('token');
      const envUrl = process.env.NEXT_PUBLIC_API_URL || 'https://digital-hub-1.onrender.com';
      const baseUrl = envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;

      const response = await fetch(
        `${baseUrl}/branding/upload`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData 
        }
      );
      const data = await response.json();
      
      if (data.url) {
        setBranding(prev => ({
          ...prev,
          [type === 'logo' ? 'logoUrl' : 'faviconUrl']: data.url
        }));
        toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully!`, { id: uploadToast });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      toast.error(`Upload failed: ${err.message}`, { id: uploadToast });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 ml-[260px]">
          <Header />
          <div className="p-8 animate-pulse space-y-8">
            <div className="h-20 bg-white rounded-3xl w-1/3" />
            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-2 h-[600px] bg-white rounded-3xl" />
              <div className="h-[600px] bg-white rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8 max-w-[1200px] mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">White-Labeling</h1>
                <p className="text-slate-500 mt-1">Configure your agency's brand identity and custom domains.</p>
              </div>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                {saving ? 'Saving...' : success ? <><CheckCircle2 size={18} /> Saved</> : <><Save size={18} /> Save Changes</>}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-8">
              {/* Main Configuration */}
              <div className="col-span-2 space-y-8">
                {/* Visual Identity */}
                <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Palette size={20} /></div>
                    <h3 className="font-black text-slate-900">Visual Identity</h3>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Agency Name</label>
                        <div className="relative">
                          <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="text" 
                            value={branding.agencyName}
                            onChange={e => setBranding({...branding, agencyName: e.target.value})}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. Acme Marketing"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Support Email</label>
                        <input 
                          type="email" 
                          value={branding.supportEmail}
                          onChange={e => setBranding({...branding, supportEmail: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="support@youragency.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Primary Color</label>
                        <div className="flex gap-3">
                          <input 
                            type="color" 
                            value={branding.primaryColor}
                            onChange={e => setBranding({...branding, primaryColor: e.target.value})}
                            className="w-12 h-12 rounded-xl cursor-pointer border-none p-0 overflow-hidden"
                          />
                          <input 
                            type="text" 
                            value={branding.primaryColor}
                            onChange={e => setBranding({...branding, primaryColor: e.target.value})}
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono uppercase"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Secondary Color</label>
                        <div className="flex gap-3">
                          <input 
                            type="color" 
                            value={branding.secondaryColor}
                            onChange={e => setBranding({...branding, secondaryColor: e.target.value})}
                            className="w-12 h-12 rounded-xl cursor-pointer border-none p-0 overflow-hidden"
                          />
                          <input 
                            type="text" 
                            value={branding.secondaryColor}
                            onChange={e => setBranding({...branding, secondaryColor: e.target.value})}
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Assets */}
                <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ImageIcon size={20} /></div>
                    <h3 className="font-black text-slate-900">Brand Assets</h3>
                  </div>
                  <div className="p-8 grid grid-cols-2 gap-8">
                    <div className="space-y-4 text-center">
                      <input 
                        type="file" 
                        ref={logoInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={() => handleFileUpload('logo')} 
                      />
                      <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center gap-4">
                        {branding.logoUrl ? (
                          <img src={branding.logoUrl} alt="Logo" className="h-12 object-contain" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400"><ImageIcon size={24} /></div>
                        )}
                        <button 
                          onClick={() => logoInputRef.current?.click()}
                          className="text-xs font-black text-indigo-600 hover:underline uppercase tracking-widest"
                        >
                          Upload Main Logo
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Recommended: 400x120px PNG/SVG</p>
                    </div>
                    <div className="space-y-4 text-center">
                      <input 
                        type="file" 
                        ref={faviconInputRef} 
                        className="hidden" 
                        accept="image/*,.ico" 
                        onChange={() => handleFileUpload('favicon')} 
                      />
                      <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center gap-4">
                        {branding.faviconUrl ? (
                          <img src={branding.faviconUrl} alt="Favicon" className="w-8 h-8 object-contain" />
                        ) : (
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><Globe size={16} /></div>
                        )}
                        <button 
                          onClick={() => faviconInputRef.current?.click()}
                          className="text-xs font-black text-indigo-600 hover:underline uppercase tracking-widest"
                        >
                          Upload Favicon
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Recommended: 32x32px ICO/PNG</p>
                    </div>
                  </div>
                </section>

                {/* Advanced Settings */}
                <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Code size={20} /></div>
                    <h3 className="font-black text-slate-900">Advanced Overrides</h3>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Custom CSS Overrides</label>
                      <textarea 
                        value={branding.customCss}
                        onChange={e => setBranding({...branding, customCss: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 min-h-[120px] outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="/* Custom CSS here... */"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100"><Shield size={18} className="text-indigo-600" /></div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">Remove "Powered By Digital Hub"</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Enterprise Feature</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setBranding({...branding, removePoweredBy: branding.removePoweredBy === 1 ? 0 : 1})}
                        className={`w-12 h-6 rounded-full transition-all relative ${branding.removePoweredBy === 1 ? 'bg-indigo-600' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${branding.removePoweredBy === 1 ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </section>
              </div>

              {/* Sidebar: Domain Management & Preview */}
              <div className="space-y-8">
                {/* Live Preview Card */}
                <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-50" />
                  <div className="relative z-10">
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Identity Preview</div>
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white" style={{ backgroundColor: branding.primaryColor }}>
                          {branding.agencyName ? branding.agencyName[0] : 'D'}
                        </div>
                        <div className="text-sm font-bold text-white">{branding.agencyName || 'Digital Hub'}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-1.5 w-full bg-white/5 rounded-full" />
                        <div className="h-1.5 w-2/3 bg-white/5 rounded-full" />
                        <div className="h-8 w-full rounded-lg mt-4" style={{ backgroundColor: branding.primaryColor }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom Domains */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-8">
                  <div className="flex items-center gap-2 mb-6 text-slate-900">
                    <Globe size={18} />
                    <h3 className="font-black text-sm uppercase tracking-widest">Custom Domains</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {Array.isArray(domains) && domains.map(d => (
                      <div key={d.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group/item">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-bold text-slate-900">{d.domain}</span>
                          <div className="flex items-center gap-2">
                            {d.isVerified ? <CheckCircle2 size={16} className="text-green-500" /> : <AlertCircle size={16} className="text-amber-500" />}
                            <button 
                              onClick={() => handleDeleteDomain(d.id)}
                              className="text-red-400 hover:text-red-600 opacity-0 group-hover/item:opacity-100 transition-opacity"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-tight text-slate-400">{d.status}</div>
                      </div>
                    ))}

                    <div className="space-y-2">
                      <input 
                        type="text" 
                        value={newDomain}
                        onChange={e => setNewDomain(e.target.value)}
                        placeholder="dashboard.agency.com"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                      <button 
                        onClick={handleAddDomain}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                      >
                        Add Domain
                      </button>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-indigo-600 mb-2">
                        <HelpCircle size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Setup Instructions</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                        Point your domain's CNAME record to <code className="text-slate-900">proxy.digitalmarketinghub.com</code> to activate white-labeling.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
