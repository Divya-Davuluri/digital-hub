'use client';
import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import RoleGuard from '@/components/RoleGuard';
import toast from 'react-hot-toast';
import {
  Search, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Plus,
  FileText, Globe, BarChart2, Target,
  ArrowUp, ArrowDown, Minus, X,
  RefreshCw, ChevronRight, ExternalLink
} from 'lucide-react';

export default function SEOContentPage() {
  const [activeTab, setActiveTab] = useState<'rankings'|'audit'|'gaps'|'briefs'>('rankings');
  const [keywords, setKeywords] = useState<any[]>([]);
  const [auditData, setAuditData] = useState<any>(null);
  const [competitorGap, setCompetitorGap] = useState<any>(null);
  const [contentBriefs, setContentBriefs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [briefLoading, setBriefLoading] = useState(false);
  const [domain, setDomain] = useState('');
  const [showAddKeyword, setShowAddKeyword] = useState(false);
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState<any>(null);

  const [keywordForm, setKeywordForm] = useState({
    keyword: '', domain: '', device: 'desktop',
    country: 'US', cluster: '', intent: 'informational',
  });

  const [briefKeyword, setBriefKeyword] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      loadStats(),
      loadKeywords(),
      loadContentBriefs(),
      loadCompetitorGap(),
    ]);
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const res = await apiCall('/seo/stats');
      setStats(res?.data || res);
    } catch (err) {
      setStats({
        totalKeywords:8, top10Keywords:3,
        avgRank:14.6, rankingImproved:5,
        rankingDeclined:2, totalIssues:7,
        criticalIssues:2, siteScore:62, totalBriefs:2,
      });
    }
  };

  const loadKeywords = async () => {
    try {
      const res = await apiCall('/seo/keywords');
      const data = res?.data || res || [];
      setKeywords(Array.isArray(data) ? data : []);
    } catch (err) {
      setKeywords(getDemoKeywordsFallback());
    }
  };

  const loadContentBriefs = async () => {
    try {
      const res = await apiCall('/seo/briefs');
      const data = res?.data || res || [];
      setContentBriefs(Array.isArray(data) ? data : []);
    } catch (err) {
      setContentBriefs([]);
    }
  };

  const loadCompetitorGap = async () => {
    try {
      const res = await apiCall('/seo/competitor-gap');
      setCompetitorGap(res?.data || res);
    } catch (err) {
      setCompetitorGap(getDemoGapFallback());
    }
  };

  const getDemoKeywordsFallback = () => ([
    { id:'f1', keyword:'digital marketing agency',
      currentRank:8, previousRank:12,
      searchVolume:18100, difficulty:67,
      cpc:8.50, intent:'commercial',
      cluster:'Agency Services', rankChange:4 },
    { id:'f2', keyword:'marketing automation tools',
      currentRank:4, previousRank:7,
      searchVolume:27100, difficulty:65,
      cpc:9.80, intent:'commercial',
      cluster:'Marketing Tools', rankChange:3 },
    { id:'f3', keyword:'social media marketing',
      currentRank:15, previousRank:18,
      searchVolume:49500, difficulty:72,
      cpc:6.20, intent:'informational',
      cluster:'Social Media', rankChange:3 },
    { id:'f4', keyword:'seo services for businesses',
      currentRank:23, previousRank:19,
      searchVolume:8100, difficulty:58,
      cpc:12.40, intent:'commercial',
      cluster:'SEO Services', rankChange:-4 },
  ]);

  const getDemoGapFallback = () => ({
    domain: 'yourdomain.com',
    opportunities: [
      { keyword:'all in one marketing platform',
        volume:8100, difficulty:54,
        opportunity:'High' },
      { keyword:'agency client reporting tool',
        volume:6600, difficulty:48,
        opportunity:'High' },
      { keyword:'white label marketing software',
        volume:4400, difficulty:43,
        opportunity:'Medium' },
      { keyword:'marketing roi tracking tool',
        volume:5400, difficulty:51,
        opportunity:'Medium' },
    ]
  });

  const handleAddKeyword = async () => {
    if (!keywordForm.keyword.trim()) {
      toast.error('Keyword is required'); return;
    }
    try {
      const res = await apiCall('/seo/keywords', {
        method: 'POST',
        body: JSON.stringify(keywordForm)
      });
      const newKw = res?.data || res;
      setKeywords(prev => [newKw, ...prev]);
      setShowAddKeyword(false);
      setKeywordForm({
        keyword:'', domain:'', device:'desktop',
        country:'US', cluster:'',
        intent:'informational',
      });
      toast.success('Keyword added to tracking!');
      loadStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add keyword');
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    setKeywords(prev => prev.filter(k => k.id !== id));
    try {
      await apiCall(`/seo/keywords/${id}`,
        { method: 'DELETE' });
      toast.success('Keyword removed');
    } catch (err) {
      loadKeywords();
    }
  };

  const handleRunAudit = async () => {
    if (!domain.trim()) {
      toast.error('Please enter a domain first');
      return;
    }
    setAuditLoading(true);
    try {
      const res = await apiCall('/seo/audit', {
        method: 'POST',
        body: JSON.stringify({ domain: domain.trim() })
      });
      setAuditData(res?.data || res);
      toast.success('Site audit complete!');
    } catch (err) {
      toast.error('Audit failed');
      // Show demo audit data
      setAuditData({
        domain: domain.trim(),
        score: 62,
        totalIssues: 7,
        critical: 2,
        high: 3,
        medium: 2,
        low: 0,
        issues: getDemoAuditFallback(domain.trim()),
        metrics: {
          pageSpeed:67, mobileScore:78,
          lcp:'3.2s', fid:'45ms',
          cls:0.18, ttfb:'0.8s',
        }
      });
    } finally {
      setAuditLoading(false);
    }
  };

  const getDemoAuditFallback = (dom: string) => ([
    { id:'a1', issueType:'missing_meta',
      severity:'high', url:`https://${dom}/about`,
      description:'Page missing meta description.',
      recommendation:'Add meta description 120-160 chars.',
      isFixed:false },
    { id:'a2', issueType:'slow_page',
      severity:'critical', url:`https://${dom}/services`,
      description:'Page load time 4.8 seconds.',
      recommendation:'Optimize images and use CDN.',
      isFixed:false },
    { id:'a3', issueType:'broken_link',
      severity:'high', url:`https://${dom}/blog`,
      description:'3 broken internal links found.',
      recommendation:'Update or remove broken links.',
      isFixed:false },
  ]);

  const handleGenerateBrief = async () => {
    if (!briefKeyword.trim()) {
      toast.error('Enter a target keyword'); return;
    }
    setBriefLoading(true);
    try {
      const res = await apiCall('/seo/briefs', {
        method: 'POST',
        body: JSON.stringify({
          target_keyword: briefKeyword.trim()
        })
      });
      const brief = res?.data || res;
      setContentBriefs(prev => [brief, ...prev]);
      setShowBriefModal(false);
      setBriefKeyword('');
      toast.success('Content brief generated!');
      setActiveTab('briefs'); // Switch to Briefs tab automatically
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate brief');
    } finally {
      setBriefLoading(false);
    }
  };

  const handleDeleteBrief = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content brief?')) return;
    try {
      await apiCall(`/seo/briefs/${id}`, { method: 'DELETE' });
      setContentBriefs(prev => prev.filter(b => b.id !== id));
      toast.success('Content brief deleted!');
    } catch (err) {
      toast.error('Failed to delete brief');
    }
  };

  const formatBriefAsMarkdown = (brief: any) => {
    return `
# SEO Content Brief: ${brief.targetKeyword}

- **SEO Title**: ${brief.title}
- **Meta Description**: ${brief.metaDescription || 'N/A'}
- **Search Intent**: ${brief.searchIntent || 'N/A'}
- **Recommended Word Count**: ${brief.recommendedWordCount || 1500} words

---

## 🔑 Primary Keywords
${Array.isArray(brief.primaryKeywords) ? brief.primaryKeywords.map((k: string) => `- ${k}`).join('\n') : '- ' + brief.targetKeyword}

## 🔑 Secondary Keywords
${Array.isArray(brief.secondaryKeywords) ? brief.secondaryKeywords.map((k: string) => `- ${k}`).join('\n') : '- N/A'}

---

## 📋 Headings Outline
${Array.isArray(brief.headings) ? brief.headings.map((h: string) => `- ${h}`).join('\n') : '- N/A'}

---

## 📝 Document Outline & Guidelines
${brief.outline || 'N/A'}

---

## 📊 Competitor Insights & Notes
${brief.competitorNotes || 'N/A'}

---

## 💡 Content Recommendations & FAQ Suggestions
${brief.contentRecommendations || 'N/A'}
    `.trim();
  };

  const getRankBadge = (rank: number | null) => {
    if (!rank) return 'bg-slate-100 text-slate-400';
    if (rank <= 3)  return 'bg-green-100 text-green-700';
    if (rank <= 10) return 'bg-blue-100 text-blue-700';
    if (rank <= 20) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high':     return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':   return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:         return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getIssueIcon = (type: string) => {
    switch(type) {
      case 'broken_link':        return '🔗';
      case 'missing_meta':       return '📄';
      case 'slow_page':          return '⚡';
      case 'missing_h1':         return '📝';
      case 'duplicate_content':  return '📋';
      case 'missing_alt':        return '🖼️';
      case 'core_web_vitals':    return '📊';
      default:                   return '⚠️';
    }
  };

  const getDifficultyColor = (diff: number) => {
    if (diff <= 30) return 'text-green-600';
    if (diff <= 50) return 'text-yellow-600';
    if (diff <= 70) return 'text-orange-500';
    return 'text-red-600';
  };

  return (
    <RoleGuard allowedRoles={['admin', 'team']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 pl-[260px]">
          <Header />
          <main className="p-8 max-w-[1400px] mx-auto">

            {/* PAGE HEADER */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-black text-slate-900">
                  SEO + Content Analysis
                </h1>
                <p className="text-slate-500 mt-1">
                  Track rankings, audit your site, find content gaps and generate briefs
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-slate-400"/>
                  <input
                    type="text"
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    placeholder="yourdomain.com"
                    className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-52"
                  />
                </div>
              </div>
            </div>

            {/* STATS BAR */}
            <div className="grid grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
              {[
                { label:'Keywords', icon:'🎯', value:stats?.totalKeywords||0 },
                { label:'Top 10', icon:'🏆', value:stats?.top10Keywords||0 },
                { label:'Avg Rank', icon:'📊', value:stats?.avgRank||0 },
                { label:'Improved', icon:'📈', value:stats?.rankingImproved||0 },
                { label:'Declined', icon:'📉', value:stats?.rankingDeclined||0 },
                { label:'Issues', icon:'⚠️', value:stats?.totalIssues||0 },
                { label:'Critical', icon:'🚨', value:stats?.criticalIssues||0 },
                { label:'Site Score', icon:'💯', value:`${stats?.siteScore||0}` },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <p className="text-lg mb-1">{stat.icon}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex gap-1 mb-6 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
              {[
                { key:'rankings', label:'📈 Rankings' },
                { key:'audit',    label:'🔍 Site Audit' },
                { key:'gaps',     label:'🎯 Content Gaps' },
                { key:'briefs',   label:'📝 Briefs' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    activeTab === tab.key
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── RANKINGS TAB ── */}
            {activeTab === 'rankings' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="font-black text-slate-900">
                      Keyword Rankings
                    </h2>
                    <p className="text-sm text-slate-500">
                      Track daily position updates
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddKeyword(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg"
                  >
                    <Plus size={16}/> Add Keyword
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        {['Keyword','Cluster','Rank','Change','Volume','Difficulty','CPC','Intent','Actions']
                        .map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {keywords.map(kw => (
                        <tr key={kw.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">

                          {/* Keyword */}
                          <td className="px-4 py-4">
                            <p className="font-bold text-slate-900 text-sm">
                              {kw.keyword}
                            </p>
                            {kw.domain && (
                              <p className="text-xs text-slate-400">
                                {kw.domain}
                              </p>
                            )}
                          </td>

                          {/* Cluster */}
                          <td className="px-4 py-4">
                            {kw.cluster ? (
                              <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">
                                {kw.cluster}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>

                          {/* Rank */}
                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-1.5 rounded-xl text-sm font-black ${getRankBadge(kw.currentRank)}`}>
                              #{kw.currentRank || '—'}
                            </span>
                          </td>

                          {/* Change */}
                          <td className="px-4 py-4">
                            {(kw.rankChange || 0) > 0 ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <ArrowUp size={14}/>
                                <span className="text-sm font-bold">+{kw.rankChange}</span>
                              </div>
                            ) : (kw.rankChange || 0) < 0 ? (
                              <div className="flex items-center gap-1 text-red-500">
                                <ArrowDown size={14}/>
                                <span className="text-sm font-bold">{kw.rankChange}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-slate-400">
                                <Minus size={14}/>
                                <span className="text-sm">0</span>
                              </div>
                            )}
                          </td>

                          {/* Volume */}
                          <td className="px-4 py-4">
                            <p className="text-sm font-bold text-slate-700">
                              {(kw.searchVolume||0).toLocaleString()}
                            </p>
                          </td>

                          {/* Difficulty */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-100 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    (kw.difficulty||0) <= 30 ? 'bg-green-500' : (kw.difficulty||0) <= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width:`${kw.difficulty||0}%` }}
                                />
                              </div>
                              <span className={`text-xs font-bold ${getDifficultyColor(kw.difficulty||0)}`}>
                                {kw.difficulty||0}
                              </span>
                            </div>
                          </td>

                          {/* CPC */}
                          <td className="px-4 py-4">
                            <p className="text-sm text-slate-600">
                              ${(kw.cpc||0).toFixed(2)}
                            </p>
                          </td>

                          {/* Intent */}
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
                              kw.intent === 'transactional' ? 'bg-green-100 text-green-700'
                              : kw.intent === 'commercial' ? 'bg-blue-100 text-blue-700'
                              : kw.intent === 'navigational' ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600'
                            }`}>
                              {kw.intent}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4">
                            <button
                              onClick={() => handleDeleteKeyword(kw.id)}
                              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <X size={14}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {keywords.length === 0 && (
                    <div className="text-center py-16">
                      <p className="text-3xl mb-3">🎯</p>
                      <p className="font-bold text-slate-900">
                        No keywords tracked yet
                      </p>
                      <button
                        onClick={() => setShowAddKeyword(true)}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold"
                      >
                        + Add First Keyword
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── AUDIT TAB ── */}
            {activeTab === 'audit' && (
              <div>
                {/* Audit Input */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
                  <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                    <Globe size={18} className="text-indigo-600"/>
                    Run Site Audit
                  </h3>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={domain}
                      onChange={e => setDomain(e.target.value)}
                      placeholder="Enter domain: nike.com"
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleRunAudit}
                      disabled={auditLoading || !domain.trim()}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                        auditLoading || !domain.trim()
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'
                      }`}
                    >
                      {auditLoading ? (
                        <>
                          <RefreshCw size={16} className="animate-spin"/>
                          Auditing...
                        </>
                      ) : (
                        <><Search size={16}/>Run Audit</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Audit Results */}
                {auditData && (
                  <div className="space-y-6">
                    {/* Score + Stats */}
                    <div className="grid grid-cols-5 gap-4">
                      <div className="col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wide mb-3">
                          SEO Score
                        </p>
                        <div className={`text-5xl font-black mb-2 ${
                          auditData.score >= 80 ? 'text-green-600'
                          : auditData.score >= 60 ? 'text-yellow-500'
                          : 'text-red-600'
                        }`}>
                          {auditData.score}
                        </div>
                        <p className="text-sm text-slate-500">out of 100</p>
                        <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
                          <div
                            className={`h-2 rounded-full ${
                              auditData.score >= 80 ? 'bg-green-500'
                              : auditData.score >= 60 ? 'bg-yellow-500'
                              : 'bg-red-500'
                            }`}
                            style={{ width:`${auditData.score}%` }}
                          />
                        </div>
                      </div>

                      {/* Core Web Vitals */}
                      <div className="col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wide mb-4">
                          Core Web Vitals
                        </p>
                        <div className="space-y-3">
                          {[
                            { label:'LCP', value:auditData.metrics?.lcp, good:'< 2.5s',
                              isGood:(auditData.metrics?.lcp||'').includes('2.') || (auditData.metrics?.lcp||'').includes('1.') },
                            { label:'FID', value:auditData.metrics?.fid, good:'< 100ms', isGood:true },
                            { label:'CLS', value:auditData.metrics?.cls, good:'< 0.1', isGood:(auditData.metrics?.cls||1) < 0.1 },
                          ].map(metric => (
                            <div key={metric.label} className="flex justify-between items-center">
                              <div>
                                <span className="text-sm font-bold text-slate-700">{metric.label}</span>
                                <span className="text-xs text-slate-400 ml-2">Good: {metric.good}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold">{metric.value}</span>
                                <span className={metric.isGood ? 'text-green-500' : 'text-red-500'}>
                                  {metric.isGood ? '✅' : '❌'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Issue Counts */}
                      <div className="col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wide mb-4">
                          Issues Found
                        </p>
                        {[
                          { label:'Critical', count:auditData.critical||0, color:'red' },
                          { label:'High', count:auditData.high||0, color:'orange' },
                          { label:'Medium', count:auditData.medium||0, color:'yellow' },
                          { label:'Low', count:auditData.low||0, color:'blue' },
                        ].map(issue => (
                          <div key={issue.label} className="flex justify-between items-center mb-2">
                            <span className="text-sm text-slate-600">{issue.label}</span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-black bg-${issue.color}-100 text-${issue.color}-700`}>
                              {issue.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Issues List */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100">
                        <h3 className="font-black text-slate-900">
                          Issues to Fix ({auditData.issues?.length || 0})
                        </h3>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {Array.isArray(auditData.issues) && auditData.issues.map((issue: any) => (
                          <div key={issue.id} className={`p-5 ${issue.isFixed ? 'bg-green-50 opacity-60' : ''}`}>
                            <div className="flex items-start gap-4">
                              <div className="text-2xl flex-shrink-0">
                                {getIssueIcon(issue.issueType)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${getSeverityColor(issue.severity)}`}>
                                    {issue.severity.toUpperCase()}
                                  </span>
                                  <span className="text-xs text-slate-400 font-mono">{issue.url}</span>
                                  {issue.isFixed && (
                                    <span className="text-xs font-bold text-green-600">✅ Fixed</span>
                                  )}
                                </div>
                                <p className="text-sm font-bold text-slate-900 mb-1">{issue.description}</p>
                                <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-xl">
                                  <span className="text-blue-600 flex-shrink-0 mt-0.5">💡</span>
                                  <p className="text-xs text-blue-700">{issue.recommendation}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty Audit State */}
                {!auditData && !auditLoading && (
                  <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-4xl mb-4">🔍</p>
                    <h3 className="font-bold text-slate-900 mb-2">No audit results yet</h3>
                    <p className="text-slate-500 text-sm mb-6">
                      Enter your domain above and click "Run Audit" to check for SEO issues
                    </p>
                    <p className="text-xs text-slate-400">
                      The audit checks for broken links, missing meta tags, page speed, Core Web Vitals, and more
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── CONTENT GAPS TAB ── */}
            {activeTab === 'gaps' && (
              <div className="space-y-6">
                {/* Opportunities */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-black text-slate-900">Keyword Opportunities</h3>
                      <p className="text-xs text-slate-400">High-value keywords you should be targeting</p>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {Array.isArray(competitorGap?.opportunities) && competitorGap.opportunities.map((opp: any, i: number) => (
                      <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 text-sm mb-1">{opp.keyword}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span>Vol: {(opp.volume||0).toLocaleString()}</span>
                            <span>Diff: {opp.difficulty}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-black ${
                            opp.opportunity === 'High' ? 'bg-green-100 text-green-700'
                            : opp.opportunity === 'Medium' ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                          }`}>
                            {opp.opportunity} Opportunity
                          </span>
                          <button
                            onClick={() => {
                              setBriefKeyword(opp.keyword);
                              setShowBriefModal(true);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                          >
                            + Brief
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Competitor Comparison */}
                {Array.isArray(competitorGap?.competitors) && competitorGap.competitors.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-black text-slate-900 mb-4">Competitor Analysis</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {competitorGap.competitors.map((comp: any, i: number) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-center mb-3">
                            <p className="font-bold text-slate-900 text-sm">{comp.domain}</p>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                              comp.theirRanking === 'Better' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {comp.theirRanking}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="text-center p-2 bg-white rounded-lg">
                              <p className="text-xs text-slate-400">Overlap</p>
                              <p className="font-black text-slate-900">{comp.overlapKeywords}</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded-lg">
                              <p className="text-xs text-slate-400">Gap</p>
                              <p className="font-black text-red-600">{comp.gapKeywords}</p>
                            </div>
                          </div>
                          <p className="text-xs font-bold text-slate-400 mb-2">Top Gap Keywords:</p>
                          {Array.isArray(comp.topGapKeywords) && comp.topGapKeywords.map((kw: any, j: number) => (
                            <div key={j} className="flex justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                              <span className="text-slate-700">{kw.keyword}</span>
                              <span className="text-slate-400">#{kw.theirRank} / {(kw.volume||0).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── BRIEFS TAB ── */}
            {activeTab === 'briefs' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="font-black text-slate-900">Content Briefs</h2>
                    <p className="text-sm text-slate-500">AI-powered content briefs for target keywords</p>
                  </div>
                  <button
                    onClick={() => setShowBriefModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg"
                  >
                    <Plus size={16}/> Generate Brief
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {contentBriefs.map(brief => (
                    <div key={brief.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            brief.status === 'completed' ? 'bg-green-100 text-green-700'
                            : brief.status === 'in_progress' ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                          }`}>
                            {brief.status?.replace('_',' ').toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-400">
                            📅 {brief.createdAt ? new Date(brief.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-indigo-600 mb-2">🎯 {brief.targetKeyword}</p>
                        <h3 className="font-black text-slate-900 text-sm mb-3">{brief.title}</h3>

                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                          <span>📝 {brief.recommendedWordCount || 1500} words</span>
                          <span>📋 {Array.isArray(brief.headings) ? brief.headings.length : 0} headings</span>
                          <span>🔑 {Array.isArray(brief.primaryKeywords) ? brief.primaryKeywords.length : 0} keywords</span>
                        </div>

                        {/* Headings preview */}
                        {Array.isArray(brief.headings) && brief.headings.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-wide mb-2">
                              Suggested Headings
                            </p>
                            <div className="space-y-1">
                              {brief.headings.slice(0,4).map((h: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                                  <ChevronRight size={12} className="text-slate-400 flex-shrink-0"/>
                                  {h}
                                </div>
                              ))}
                              {brief.headings.length > 4 && (
                                <p className="text-xs text-slate-400 pl-4">
                                  +{brief.headings.length - 4} more headings...
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => setSelectedBrief(brief)}
                          className="flex-grow py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors"
                        >
                          View Brief
                        </button>
                        <button
                          onClick={() => handleDeleteBrief(brief.id)}
                          className="px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center"
                          title="Delete Brief"
                        >
                          <X size={16}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {contentBriefs.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-4xl mb-4">📝</p>
                    <h3 className="font-bold text-slate-900 mb-2">No content briefs yet</h3>
                    <p className="text-slate-500 text-sm mb-6">
                      Generate your first brief to get an AI-powered content strategy
                    </p>
                    <button
                      onClick={() => setShowBriefModal(true)}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold"
                    >
                      + Generate Brief
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ADD KEYWORD MODAL */}
            {showAddKeyword && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-black text-slate-900">Add Keyword to Track</h2>
                    <button onClick={() => setShowAddKeyword(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={20}/>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1.5">Keyword *</label>
                      <input
                        type="text"
                        value={keywordForm.keyword}
                        onChange={e => setKeywordForm(p => ({...p, keyword:e.target.value}))}
                        placeholder="digital marketing agency"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1.5">Domain</label>
                      <input
                        type="text"
                        value={keywordForm.domain}
                        onChange={e => setKeywordForm(p => ({...p, domain:e.target.value}))}
                        placeholder="yourdomain.com"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1.5">Cluster</label>
                        <input
                          type="text"
                          value={keywordForm.cluster}
                          onChange={e => setKeywordForm(p => ({...p, cluster:e.target.value}))}
                          placeholder="Agency Services"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1.5">Intent</label>
                        <select
                          value={keywordForm.intent}
                          onChange={e => setKeywordForm(p => ({...p, intent:e.target.value}))}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                        >
                          <option value="informational">Informational</option>
                          <option value="commercial">Commercial</option>
                          <option value="transactional">Transactional</option>
                          <option value="navigational">Navigational</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowAddKeyword(false)}
                      className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddKeyword}
                      className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg"
                    >
                      Add Keyword
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* GENERATE BRIEF MODAL */}
            {showBriefModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-black text-slate-900">Generate Content Brief</h2>
                    <button
                      onClick={() => { setShowBriefModal(false); setBriefKeyword(''); }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={20}/>
                    </button>
                  </div>

                  <div className="mb-6">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wide block mb-1.5">Target Keyword *</label>
                    <input
                      type="text"
                      value={briefKeyword}
                      onChange={e => setBriefKeyword(e.target.value)}
                      placeholder="e.g. digital marketing agency guide"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-slate-400 mt-2">
                      We will generate a complete content brief with headings, keywords, word count and competitor analysis.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowBriefModal(false); setBriefKeyword(''); }}
                      className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerateBrief}
                      disabled={briefLoading || !briefKeyword.trim()}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                        briefLoading || !briefKeyword.trim()
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'
                      }`}
                    >
                      {briefLoading ? '⏳ Generating...' : '✨ Generate Brief'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW DETAILED BRIEF MODAL */}
            {selectedBrief && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                  {/* Modal Header */}
                  <div className="flex justify-between items-center p-6 border-b border-slate-100 flex-shrink-0">
                    <div>
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold mr-3 animate-pulse">
                        🎯 {selectedBrief.targetKeyword}
                      </span>
                      <h2 className="text-lg font-black text-slate-900 mt-2">{selectedBrief.title}</h2>
                    </div>
                    <button
                      onClick={() => setSelectedBrief(null)}
                      className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-xl"
                    >
                      <X size={20}/>
                    </button>
                  </div>

                  {/* Modal Content (scrollable) */}
                  <div className="p-6 overflow-y-auto space-y-8 flex-grow">
                    {/* Basic Meta Cards */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Search Intent</span>
                        <p className="font-bold text-slate-900 mt-1 capitalize">{selectedBrief.searchIntent || 'Informational'}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Suggested Length</span>
                        <p className="font-bold text-slate-900 mt-1">{selectedBrief.recommendedWordCount || 1500} words</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Status</span>
                        <p className="font-bold text-slate-900 mt-1 capitalize">{selectedBrief.status}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Generated</span>
                        <p className="font-bold text-slate-900 mt-1">{new Date(selectedBrief.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Meta Description */}
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wide mb-2">Meta Description</h3>
                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl text-slate-700 text-sm italic">
                        {selectedBrief.metaDescription || 'No meta description generated.'}
                      </div>
                    </div>

                    {/* Keywords Section */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wide mb-3">🔑 Primary Keywords</h3>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(selectedBrief.primaryKeywords) ? (
                            selectedBrief.primaryKeywords.map((k: string, i: number) => (
                              <span key={i} className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-xs font-bold">
                                {k}
                              </span>
                            ))
                          ) : (
                            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-xs font-bold">
                              {selectedBrief.targetKeyword}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wide mb-3">🔑 Secondary Keywords</h3>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(selectedBrief.secondaryKeywords) && selectedBrief.secondaryKeywords.length > 0 ? (
                            selectedBrief.secondaryKeywords.map((k: string, i: number) => (
                              <span key={i} className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold">
                                {k}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">None generated</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Outline / Outline Guidelines */}
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wide mb-3">📋 Document Structure Outline</h3>
                      <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                        <div className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-3">
                          Headings Checklist:
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {Array.isArray(selectedBrief.headings) && selectedBrief.headings.map((h: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></span>
                              {h}
                            </div>
                          ))}
                        </div>

                        <div className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2 pt-2 mb-2">
                          Outline Section Guidelines:
                        </div>
                        <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-xl border border-slate-150 shadow-sm">
                          {selectedBrief.outline}
                        </div>
                      </div>
                    </div>

                    {/* Competitor Insights */}
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wide mb-3">📊 Competitor Insights & Strategy</h3>
                      <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {selectedBrief.competitorNotes}
                      </div>
                    </div>

                    {/* Recommendations & FAQ */}
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wide mb-3">💡 Optimization Recommendations & FAQs</h3>
                      <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {selectedBrief.contentRecommendations}
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-between gap-3 flex-shrink-0">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const markdown = formatBriefAsMarkdown(selectedBrief);
                          navigator.clipboard.writeText(markdown);
                          toast.success('Formatted Brief copied to Clipboard!');
                        }}
                        className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-1.5"
                      >
                        📋 Copy formatted text
                      </button>
                      <button
                        onClick={() => {
                          const markdown = formatBriefAsMarkdown(selectedBrief);
                          const blob = new Blob([markdown], { type: 'text/markdown' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `seo-brief-${selectedBrief.targetKeyword.replace(/\s+/g, '-')}.md`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success('Downloaded SEO Brief Markdown file!');
                        }}
                        className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-1.5"
                      >
                        📥 Download .MD file
                      </button>
                    </div>
                    <button
                      onClick={() => setSelectedBrief(null)}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 shadow-md"
                    >
                      Close Brief
                    </button>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
