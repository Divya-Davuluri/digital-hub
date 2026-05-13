'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import RoleGuard from '@/components/RoleGuard';
import { getCampaignById, Campaign } from '@/services/campaignService';
import { 
  ArrowLeft, Calendar, Target, TrendingUp, BarChart2, 
  Layers, ExternalLink, Activity, Info, Settings,
  DollarSign, MousePointer2, Eye, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function CampaignDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCampaign();
    }
  }, [id]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const data = await getCampaignById(id as string);
      setCampaign(data);
    } catch (err: any) {
      console.error('Error fetching campaign:', err);
      setError(err.message || 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="admin" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <div className="p-8 flex items-center justify-center h-[calc(100vh-80px)]">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
              <p className="text-slate-500 font-medium">Loading campaign details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="admin" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <div className="p-8 flex flex-col items-center justify-center h-[calc(100vh-80px)]">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 text-3xl shadow-inner">
              ⚠️
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">
              {error === 'Campaign not found' ? 'Campaign Not Found' : 'Error Loading Campaign'}
            </h2>
            <p className="text-slate-500 mb-8 max-w-md text-center">
              We couldn't retrieve the details for this campaign. The ID might be invalid or you might not have permission to view it.
            </p>
            <button 
              onClick={() => router.push('/dashboard/admin/campaigns')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <ArrowLeft size={18} /> Back to Campaigns
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;
  const cpc = campaign.clicks > 0 ? campaign.spent / campaign.clicks : 0;

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="flex min-h-screen bg-[#f8fafc]">
        <Sidebar role="admin" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8 max-w-[1400px] mx-auto">
            {/* Breadcrumb & Navigation */}
            <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={() => router.push('/dashboard/admin/campaigns')}
                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all shadow-sm"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  <Link href="/dashboard/admin/campaigns" className="hover:text-indigo-600 transition-colors">Campaigns</Link>
                  <span>/</span>
                  <span className="text-slate-900">Details</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{campaign.name}</h1>
              </div>
              <div className="ml-auto flex gap-3">
                <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border shadow-sm ${
                  campaign.status === 'active' || campaign.status === 'ACTIVE' 
                    ? 'bg-green-50 text-green-600 border-green-100' 
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  {campaign.status}
                </span>
                <button className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
                  <Settings size={16} /> Edit Settings
                </button>
              </div>
            </div>

            {/* Performance Snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard title="Total Spend" value={`$${campaign.spent.toLocaleString()}`} icon={DollarSign} color="indigo" trend="+12.5%" />
              <MetricCard title="Impressions" value={campaign.impressions.toLocaleString()} icon={Eye} color="blue" trend="+5.2%" />
              <MetricCard title="Total Clicks" value={campaign.clicks.toLocaleString()} icon={MousePointer2} color="emerald" trend="-2.1%" />
              <MetricCard title="Conversions" value={campaign.conversions.toLocaleString()} icon={Target} color="amber" trend="+8.4%" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Details & Creative */}
              <div className="lg:col-span-2 space-y-8">
                {/* Campaign Info */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Info className="text-indigo-600" size={20} />
                      Campaign Overview
                    </h3>
                  </div>
                  <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-8">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Client</p>
                      <p className="text-sm font-bold text-slate-900">{campaign.clientName || 'Direct'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Platform</p>
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${campaign.channel === 'google' ? 'bg-red-500' : 'bg-blue-500'}`} />
                        {campaign.platform || campaign.channel}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Budget</p>
                      <p className="text-sm font-bold text-slate-900">${campaign.budget.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CTR</p>
                      <p className="text-sm font-bold text-indigo-600">{ctr.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CPC</p>
                      <p className="text-sm font-bold text-emerald-600">${cpc.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Start Date</p>
                      <p className="text-sm font-bold text-slate-900">{campaign.startDate || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Creative Preview */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Zap className="text-amber-500" size={20} />
                      Featured Creative
                    </h3>
                  </div>
                  <div className="p-8">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      <div className="w-full md:w-1/3 aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center">
                        {campaign.creativeUrl ? (
                          <img src={campaign.creativeUrl} alt="Ad Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-300">
                            <BarChart2 size={40} />
                            <span className="text-xs font-bold uppercase tracking-widest">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-6">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Headline</p>
                          <h4 className="text-xl font-bold text-slate-900 leading-tight">
                            {campaign.headline || 'Exclusive Marketing Growth Strategy'}
                          </h4>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Call to Action</p>
                          <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20">
                            {campaign.cta || 'Learn More'} <ArrowLeft className="rotate-180" size={16} />
                          </div>
                        </div>
                        {campaign.creativeUrl && (
                          <div className="pt-4 border-t border-slate-50">
                            <a 
                              href={campaign.creativeUrl} 
                              target="_blank" 
                              className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform"
                            >
                              View Asset Details <ExternalLink size={14} />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Timeline & Health */}
              <div className="space-y-8">
                {/* Campaign Health */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-black text-slate-900 mb-6">Campaign Health</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Budget Utilization</span>
                        <span className="text-xs font-black text-indigo-600">{Math.round((campaign.spent / campaign.budget) * 100)}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)]" 
                          style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Conversion Rate</span>
                        <span className="text-xs font-black text-emerald-600">
                          {campaign.clicks > 0 ? ((campaign.conversions / campaign.clicks) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" 
                          style={{ width: `${campaign.clicks > 0 ? (campaign.conversions / campaign.clicks) * 100 * 5 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ad Groups</p>
                    <p className="text-lg font-black text-slate-900">12</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Creatives</p>
                    <p className="text-lg font-black text-slate-900">4</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">ROI</p>
                    <p className="text-lg font-black text-emerald-600">3.4x</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                    <p className="text-lg font-black text-indigo-600">Peak</p>
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

function MetricCard({ title, value, icon: Icon, color, trend }: any) {
  const colorMap: any = {
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl border ${colorMap[color]}`}>
          <Icon size={24} />
        </div>
        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${trend.includes('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {trend}
        </span>
      </div>
      <div className="text-2xl font-black text-slate-900 mb-1">{value}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
    </motion.div>
  );
}

