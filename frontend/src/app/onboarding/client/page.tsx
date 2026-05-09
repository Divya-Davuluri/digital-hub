'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import apiCall from "@/lib/api";

export default function ClientOnboardingPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: user?.name || '',
    logoUrl: '',
    primaryColor: '#4f46e5'
  });
  const [submitting, setSubmitting] = useState(false);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await apiCall("/api/onboarding/client/complete", {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      await refreshUser();
      router.push("/dashboard/client");
    } catch (err: any) {
      alert(err.message || "Failed to complete onboarding");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col">
        {/* Progress Bar */}
        <div className="h-2 bg-slate-100 flex">
          <div className="bg-primary transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        <div className="p-12 md:p-16 flex-1">
          {step === 1 && (
            <div className="animate-subtle-fade">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 block">Step 01 / 04</span>
              <h1 className="text-4xl font-bold text-slate-900 mb-4">Welcome to HubSaaS!</h1>
              <p className="text-slate-500 mb-10">Let's start by confirming your agency workspace name. This will be visible on your dashboard and reports.</p>
              
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1 mb-2">Workspace / Company Name</label>
                <input 
                  type="text" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-bold text-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-subtle-fade">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 block">Step 02 / 04</span>
              <h1 className="text-4xl font-bold text-slate-900 mb-4">Add your logo</h1>
              <p className="text-slate-500 mb-10">Personalize your portal by adding your company logo URL. This will appear on your white-label reports.</p>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1 mb-2">Logo URL</label>
                  <input 
                    type="text" 
                    placeholder="https://yourcompany.com/logo.png"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                    value={formData.logoUrl}
                    onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                  />
                </div>
                {formData.logoUrl && (
                  <div className="p-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex items-center justify-center">
                    <img src={formData.logoUrl} alt="Preview" className="max-h-20 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-subtle-fade">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 block">Step 03 / 04</span>
              <h1 className="text-4xl font-bold text-slate-900 mb-4">Choose your brand color</h1>
              <p className="text-slate-500 mb-10">Select a primary color that matches your brand. This will be used for buttons, links, and report accents.</p>
              
              <div className="grid grid-cols-5 gap-4">
                {['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#06b6d4'].map(color => (
                  <button 
                    key={color}
                    onClick={() => setFormData({...formData, primaryColor: color})}
                    className={`h-16 rounded-2xl transition-all ${formData.primaryColor === color ? 'ring-4 ring-offset-4 ring-slate-200 scale-105' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <div className="col-span-full pt-4">
                   <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block ml-1 mb-2">Custom HEX Color</label>
                   <div className="flex gap-4">
                      <input 
                        type="color" 
                        className="h-14 w-20 bg-white border border-slate-200 rounded-xl cursor-pointer"
                        value={formData.primaryColor}
                        onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                      />
                      <input 
                        type="text" 
                        className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-mono focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all uppercase"
                        value={formData.primaryColor}
                        onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                      />
                   </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-subtle-fade text-center py-10">
              <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-8">✨</div>
              <h1 className="text-4xl font-bold text-slate-900 mb-4">Ready to go!</h1>
              <p className="text-slate-500 mb-10">Your workspace is configured and your portal is ready. Welcome to the future of your digital marketing management.</p>
              
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-left mb-10">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl" style={{ backgroundColor: formData.primaryColor }} />
                    <div>
                       <p className="font-bold text-slate-900">{formData.companyName}</p>
                       <p className="text-xs text-slate-400">Custom Branding Enabled</p>
                    </div>
                 </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-12 pt-10 border-t border-slate-100">
            {step > 1 ? (
              <button onClick={prevStep} className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">
                Back
              </button>
            ) : <div />}
            
            <button 
              onClick={step === 4 ? handleComplete : nextStep}
              disabled={submitting}
              className="px-10 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {submitting ? 'Finalizing...' : step === 4 ? 'Complete Setup' : 'Next Step →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
