'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";
import { updateBranding } from "@/services/brandingService";
import { useBranding } from "@/context/BrandingContext";

export default function BrandingPage() {
  const { refreshBranding } = useBranding();
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [secondaryColor, setSecondaryColor] = useState('#10b981');
  const [logoUrl, setLogoUrl] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const res = await fetch('/api/admin/branding');
        if (res.ok) {
          const branding = await res.json();
          setPrimaryColor(branding.primaryColor || '#4f46e5');
          setSecondaryColor(branding.secondaryColor || '#10b981');
          setLogoUrl(branding.logoUrl || '');
          setSubdomain(branding.subdomain || '');
        }
      } catch (err) {
        console.error('Load branding:', err);
        setSecondaryColor('#10b981');
      } finally {
        setLoading(false);
      }
    };
    
    loadBranding();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await updateBranding({ primaryColor, secondaryColor, logoUrl, subdomain });
      await refreshBranding();
      setMessage('Branding updated successfully!');
    } catch (err: any) {
      setMessage(err.message || 'Error updating branding');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="admin" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8 max-w-4xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">White-Label Branding</h1>
              <p className="text-slate-500">Customize the look and feel of your agency's dashboard.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={primaryColor || '#4f46e5'} 
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-12 rounded cursor-pointer border-none"
                    />
                    <input 
                      type="text" 
                      value={primaryColor} 
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Secondary Color</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={secondaryColor || '#10b981'} 
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-12 h-12 rounded cursor-pointer border-none"
                    />
                    <input 
                      type="text" 
                      value={secondaryColor} 
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Logo URL</label>
                <input 
                  type="url" 
                  value={logoUrl} 
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://your-agency.com/logo.png"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Agency Subdomain</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={subdomain} 
                    onChange={(e) => setSubdomain(e.target.value)}
                    placeholder="my-agency"
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                  />
                  <span className="text-slate-500 font-medium text-sm">.hubsaas.com</span>
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-lg text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {message}
                </div>
              )}

              <button 
                type="submit" 
                disabled={saving}
                style={{ backgroundColor: primaryColor }}
                className="w-full py-3 text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving Changes...' : 'Save Branding Settings'}
              </button>
            </form>

            <div className="mt-12 bg-slate-900 p-8 rounded-2xl text-white">
               <h3 className="text-lg font-bold mb-4">Preview</h3>
               <div className="flex gap-8 items-center">
                  <div className="flex-1 bg-white p-6 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: primaryColor }}></div>
                      <div className="w-24 h-4 bg-slate-100 rounded"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="w-full h-3 bg-slate-50 rounded"></div>
                      <div className="w-2/3 h-3 bg-slate-50 rounded"></div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Brand Colors</div>
                    <div className="flex gap-3">
                      <div className="flex-1 h-10 rounded-lg" style={{ backgroundColor: primaryColor }}></div>
                      <div className="flex-1 h-10 rounded-lg border border-slate-200"></div>
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
