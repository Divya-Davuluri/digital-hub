'use client';
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { updateBranding, BrandingSettings } from "@/services/brandingService";
import { useBranding } from "@/context/BrandingContext";

export default function BrandingPage() {
  const { branding: globalBranding, refreshBranding } = useBranding();
  const [settings, setSettings] = useState<BrandingSettings>({
    primaryColor: '#4f46e5',
    secondaryColor: '#10b981',
    logoUrl: '',
    subdomain: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (globalBranding) {
      setSettings(globalBranding);
      setLoading(false);
    }
  }, [globalBranding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await updateBranding(settings);
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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
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
                    value={settings.primaryColor} 
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="w-12 h-12 rounded cursor-pointer border-none"
                  />
                  <input 
                    type="text" 
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Secondary Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={settings.secondaryColor} 
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    className="w-12 h-12 rounded cursor-pointer border-none"
                  />
                  <input 
                    type="text" 
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Logo URL</label>
              <input 
                type="text" 
                value={settings.logoUrl}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Subdomain</label>
              <div className="flex items-center">
                <input 
                  type="text" 
                  value={settings.subdomain}
                  onChange={(e) => setSettings({ ...settings, subdomain: e.target.value })}
                  placeholder="your-agency"
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-l-lg text-sm"
                />
                <span className="px-4 py-2 bg-slate-50 border border-l-0 border-slate-200 rounded-r-lg text-sm text-slate-500">
                  .marketingsaas.com
                </span>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <button 
                type="submit"
                disabled={saving}
                style={{ backgroundColor: settings.primaryColor }}
                className="px-8 py-3 text-white rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {message && (
                <span className={`text-sm font-medium ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
                </span>
              )}
            </div>
          </form>

          {/* Preview Section */}
          <div className="mt-12">
            <h3 className="text-lg font-bold mb-4">Live Preview</h3>
            <div className="bg-slate-200 p-8 rounded-2xl border-4 border-dashed border-slate-300 flex items-center justify-center">
               <div className="bg-white w-full max-w-sm rounded-xl shadow-lg overflow-hidden">
                  <div className="h-12 border-b border-slate-100 flex items-center px-4 justify-between">
                    <div className="w-24 h-6 bg-slate-100 rounded flex items-center justify-center text-[10px] text-slate-400">
                      {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="max-h-full" /> : 'Your Logo'}
                    </div>
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="w-2/3 h-4 bg-slate-100 rounded mb-4"></div>
                    <div className="w-full h-32 bg-slate-50 rounded mb-4 flex items-center justify-center">
                       <div 
                         style={{ backgroundColor: settings.primaryColor }}
                         className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                       >
                         ✓
                       </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 h-10 rounded-lg" style={{ backgroundColor: settings.primaryColor }}></div>
                      <div className="flex-1 h-10 rounded-lg border border-slate-200"></div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
