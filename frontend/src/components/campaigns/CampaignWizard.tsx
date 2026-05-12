'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, Target, Users, Image as ImageIcon, CheckCircle, 
  ChevronRight, ChevronLeft, Send, Search, Layout, Globe,
  Share2, MessageCircle, Upload
} from 'lucide-react';
import { createCampaign, getCampaignTemplates } from '@/services/campaignService';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 'objective', name: 'Objective', icon: Rocket },
  { id: 'channel', name: 'Channel & Budget', icon: Globe },
  { id: 'targeting', name: 'Audience', icon: Users },
  { id: 'creative', name: 'Creative', icon: ImageIcon },
  { id: 'review', name: 'Review', icon: CheckCircle },
];

const OBJECTIVES = [
  { id: 'awareness', name: 'Brand Awareness', desc: 'Reach the maximum number of people.', icon: '📢' },
  { id: 'traffic', name: 'Website Traffic', desc: 'Send people to a destination.', icon: '🔗' },
  { id: 'conversions', name: 'Conversions', desc: 'Get people to take an action.', icon: '🎯' },
  { id: 'leads', name: 'Lead Generation', desc: 'Collect leads for your business.', icon: '👥' },
];

const CHANNELS = [
  { id: 'google', name: 'Google Ads', icon: Globe, color: 'text-red-500' },
  { id: 'facebook', name: 'Facebook', icon: Share2, color: 'text-blue-600' },
  { id: 'instagram', name: 'Instagram', icon: ImageIcon, color: 'text-pink-600' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'text-black' },
];

export default function CampaignWizard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    objective: 'awareness',
    channel: 'google',
    budget: 500,
    startDate: '',
    endDate: '',
    scheduling: {
      type: 'always', // 'always' or 'schedule'
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      times: '00:00-23:59'
    },
    targeting: {
      location: 'United States',
      ageRange: '18-65',
      interests: [] as string[],
    },
    adGroups: [
      {
        name: 'Ad Group 1',
        budget: 500,
        creatives: [
          { name: 'Main Creative', headline: '', description: '', url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop' }
        ]
      }
    ]
  });

  const nextStep = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const handlePublish = async () => {
    setLoading(true);
    try {
      await createCampaign(formData);
      toast.success('Campaign launched successfully! 🚀');
      router.push('/dashboard/admin/campaigns');
      router.refresh();
    } catch (err: any) {
      console.error("Publish Error:", err);
      toast.error(err.message || "Failed to publish campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[600px] flex flex-col">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-8 py-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Campaign Creation Wizard</h2>
            <p className="text-sm text-slate-500">Step {step + 1} of {STEPS.length}: {STEPS[step].name}</p>
          </div>
          <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600">
            Cancel
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <motion.div 
                initial={false}
                animate={{ width: i <= step ? '100%' : '0%' }}
                className={`h-full ${i === step ? 'bg-indigo-600' : i < step ? 'bg-indigo-400' : 'bg-slate-200'}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 p-10 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {OBJECTIVES.map((obj) => (
                    <button
                      key={obj.id}
                      onClick={() => setFormData({ ...formData, objective: obj.id })}
                      className={`p-6 rounded-2xl border-2 text-left transition-all ${
                        formData.objective === obj.id 
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-100' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="text-3xl mb-3">{obj.icon}</div>
                      <h4 className="font-bold text-slate-900">{obj.name}</h4>
                      <p className="text-sm text-slate-500">{obj.desc}</p>
                    </button>
                  ))}
                </div>
                <div className="pt-4">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Campaign Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. Summer 2026 Product Launch"
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-4">Select Channel</label>
                  <div className="grid grid-cols-4 gap-4">
                    {CHANNELS.map((ch) => (
                      <button
                        key={ch.id}
                        onClick={() => setFormData({ ...formData, channel: ch.id as any })}
                        className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                          formData.channel === ch.id 
                            ? 'border-indigo-600 bg-indigo-50/50' 
                            : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className={`text-2xl ${ch.color}`}>{typeof ch.icon === 'string' ? ch.icon : <ch.icon size={24} />}</div>
                        <span className="text-sm font-bold text-slate-900">{ch.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Monthly Budget (USD)</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="100" 
                        max="10000" 
                        step="100"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) })}
                        className="flex-1 accent-indigo-600"
                      />
                      <div className="px-4 py-2 bg-slate-100 rounded-lg font-bold text-slate-900 w-24 text-center">
                        ${formData.budget}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Scheduling</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Start Date</label>
                        <input 
                          type="date" 
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">End Date</label>
                        <input 
                          type="date" 
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                    <input 
                      type="text" 
                      value={formData.targeting.location}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        targeting: { ...formData.targeting, location: e.target.value } 
                      })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Age Range</label>
                    <select 
                      value={formData.targeting.ageRange}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        targeting: { ...formData.targeting, ageRange: e.target.value } 
                      })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option>18-24</option>
                      <option>25-34</option>
                      <option>35-44</option>
                      <option>45-65</option>
                      <option>18-65</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Interests & Keywords</label>
                  <div className="flex flex-wrap gap-2 p-4 border border-slate-200 rounded-xl bg-slate-50">
                    {['Marketing', 'SaaS', 'Startup', 'Technology'].map(interest => (
                      <span key={interest} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600">
                        {interest}
                      </span>
                    ))}
                    <button className="text-xs text-indigo-600 font-bold hover:underline">+ Add more</button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const newAdGroups = [...formData.adGroups];
                      newAdGroups[0].creatives[0].name = file.name;
                      setFormData({ ...formData, adGroups: newAdGroups });
                    }
                  }}
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center bg-slate-50/30 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/20 transition-all group"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                    {formData.adGroups[0].creatives[0].name !== 'Main Creative' ? '✅' : '🖼️'}
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">
                    {formData.adGroups[0].creatives[0].name !== 'Main Creative' 
                      ? formData.adGroups[0].creatives[0].name 
                      : 'Drag & Drop Creatives'}
                  </h4>
                  <p className="text-sm text-slate-500 mb-4">Upload images or videos for your ads. (Max 10MB)</p>
                  <button className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                    Choose Files
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Headline</label>
                    <input 
                      type="text" 
                      value={formData.adGroups[0].creatives[0].headline}
                      onChange={(e) => {
                        const newAdGroups = [...formData.adGroups];
                        newAdGroups[0].creatives[0].headline = e.target.value;
                        setFormData({ ...formData, adGroups: newAdGroups });
                      }}
                      placeholder="e.g. Best SaaS Marketing Tool"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Call to Action</label>
                    <select 
                      value={formData.adGroups[0].creatives[0].url} // Reusing URL for CTA enum in this simplified UI
                      onChange={(e) => {
                        const newAdGroups = [...formData.adGroups];
                        newAdGroups[0].creatives[0].url = e.target.value;
                        setFormData({ ...formData, adGroups: newAdGroups });
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="learn_more">Learn More</option>
                      <option value="sign_up">Sign Up</option>
                      <option value="get_quote">Get Quote</option>
                      <option value="download">Download</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8">
                <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                    <CheckCircle size={18} /> Ready to Publish
                  </h4>
                  <p className="text-sm text-indigo-700">Review your campaign details before pushing live to {formData.channel}.</p>
                </div>

                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configuration</h5>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Name</span>
                      <span className="text-sm font-bold text-slate-900">{formData.name || 'Untitled'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Objective</span>
                      <span className="text-sm font-bold text-slate-900 capitalize">{formData.objective}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Platform</span>
                      <span className="text-sm font-bold text-slate-900 capitalize">{formData.channel}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Budget & Targeting</h5>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Monthly Budget</span>
                      <span className="text-sm font-bold text-indigo-600">${formData.budget}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Location</span>
                      <span className="text-sm font-bold text-slate-900">{formData.targeting.location}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-500">Audience</span>
                      <span className="text-sm font-bold text-slate-900">{formData.targeting.ageRange} Interests</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
        <button 
          onClick={prevStep}
          disabled={step === 0}
          className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all disabled:opacity-30"
        >
          Back
        </button>
        <div className="flex gap-3">
          {step < STEPS.length - 1 ? (
            <button 
              onClick={nextStep}
              disabled={step === 0 && !formData.name}
              className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button 
              onClick={handlePublish}
              disabled={loading}
              className="px-10 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Launch Campaign'} <Send size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
