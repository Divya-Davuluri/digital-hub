'use client';
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { updateBranding, BrandingSettings } from "@/services/brandingService";
import { useBranding } from "@/context/BrandingContext";
import Image from 'next/image';

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

          {/* Live Preview Section */}
          <div className="mt-12">
            <h3 className="text-lg font-bold mb-4">Live Preview</h3>
            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#f9fafb',
              height: '250px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
            }}>
              {/* Top navbar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                background: '#1e1e2e',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}>
                {/* Left - Logo */}
                <div>
                  {settings.logoUrl ? (
                    <Image 
                      src={settings.logoUrl} 
                      alt="logo" 
                      width={90}
                      height={24}
                      style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
                      unoptimized
                    />
                  ) : (
                    <div style={{ 
                      background: settings.primaryColor, 
                      color: 'white', 
                      fontSize: '11px',
                      fontWeight: '500',
                      padding: '3px 10px', 
                      borderRadius: '4px' 
                    }}>YourLogo</div>
                  )}
                </div>

                {/* Right - 3 colored dots */}
                <div style={{ 
                  display: 'flex', 
                  gap: '6px', 
                  alignItems: 'center' 
                }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f57' }}></div>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#febc2e' }}></div>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28c840' }}></div>
                </div>
              </div>
              
              {/* Body */}
              <div style={{ display: 'flex', height: '206px' }}>
                {/* Sidebar */}
                <div style={{ 
                  width: '60px', 
                  background: settings.primaryColor,
                  opacity: 0.9,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '12px 8px'
                }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ 
                      height: '6px', 
                      background: 'rgba(255,255,255,0.4)', 
                      borderRadius: '3px' 
                    }}></div>
                  ))}
                </div>
                
                {/* Content */}
                <div style={{ flex: 1, padding: '16px', background: 'white' }}>
                  <div style={{ 
                    height: '8px', width: '60%',
                    background: '#e5e7eb', borderRadius: '4px',
                    marginBottom: '16px'
                  }}></div>
                  <div style={{ 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px'
                  }}>
                    <div style={{ 
                      width: '32px', height: '32px',
                      borderRadius: '50%',
                      background: settings.primaryColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '16px'
                    }}>✓</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ 
                      padding: '6px 16px',
                      background: settings.primaryColor,
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>Primary</div>
                    <div style={{ 
                      padding: '6px 16px',
                      background: settings.secondaryColor,
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>Secondary</div>
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
