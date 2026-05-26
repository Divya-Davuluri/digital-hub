'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import apiCall from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import RoleGuard from '@/components/RoleGuard';
import toast from 'react-hot-toast';
import {
  Check, X, Zap, Crown, Building,
  CreditCard, AlertCircle, Shield,
  ExternalLink, RefreshCw, Loader2
} from 'lucide-react';

const PLANS_CONFIG = [
  {
    id:          'starter',
    name:        'Starter',
    price:       49,
    annualPrice: 490,
    color:       '#6366F1',
    icon:        '🚀',
    description: 'Perfect for solo operators and small agencies',
    features: [
      { label:'3 Client Workspaces',    included:true },
      { label:'2 Team Seats',           included:true },
      { label:'2 Channels',             included:true },
      { label:'200 Social Posts/mo',    included:true },
      { label:'5 Automation Workflows', included:true },
      { label:'Basic Attribution',      included:true },
      { label:'Email Support',          included:true },
      { label:'White-Label Branding',   included:false },
      { label:'AI Creative',            included:false },
      { label:'Instagram DM',           included:false },
    ],
  },
  {
    id:          'growth',
    name:        'Growth',
    price:       149,
    annualPrice: 1490,
    color:       '#8B5CF6',
    icon:        '📈',
    badge:       'Most Popular',
    description: 'For growing agencies with multiple clients',
    features: [
      { label:'10 Client Workspaces',   included:true },
      { label:'5 Team Seats',           included:true },
      { label:'White-Label Branding',   included:true },
      { label:'5 Channels',             included:true },
      { label:'1,000 Social Posts/mo',  included:true },
      { label:'25 Automation Workflows',included:true },
      { label:'SEO + Content Analysis', included:true },
      { label:'CRM + Lead Scoring',     included:true },
      { label:'A/B Testing',            included:true },
      { label:'Email + Chat Support',   included:true },
      { label:'Instagram DM',           included:false },
      { label:'Custom Domain',          included:false },
    ],
  },
  {
    id:          'agency_pro',
    name:        'Agency Pro',
    price:       349,
    annualPrice: 3490,
    color:       '#F59E0B',
    icon:        '⚡',
    badge:       'Best Value',
    description: 'For established agencies with unlimited needs',
    features: [
      { label:'Unlimited Workspaces',   included:true },
      { label:'15 Team Seats',          included:true },
      { label:'Custom Domain',          included:true },
      { label:'All Channels',           included:true },
      { label:'Unlimited Everything',   included:true },
      { label:'Full AI Creative',       included:true },
      { label:'Instagram DM',           included:true },
      { label:'Server-Side Tracking',   included:true },
      { label:'AI Visibility Tracking', included:true },
      { label:'SSO Support',            included:true },
      { label:'Dedicated CSM',          included:true },
      { label:'Read API Access',        included:true },
    ],
  },
  {
    id:          'enterprise',
    name:        'Enterprise',
    price:       0,
    annualPrice: 0,
    color:       '#10B981',
    icon:        '🏢',
    description: 'Custom solutions for large enterprises',
    features: [
      { label:'Everything in Agency Pro',included:true },
      { label:'Unlimited Team Seats',   included:true },
      { label:'Predictive Analytics',   included:true },
      { label:'Full API Access',        included:true },
      { label:'24/7 SLA Support',       included:true },
      { label:'Custom Integrations',    included:true },
      { label:'Dedicated Account Mgr',  included:true },
      { label:'Custom Onboarding',      included:true },
    ],
  },
];

function BillingPageContent() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const searchParams = useSearchParams();

  const loadSubscription = async () => {
    try {
      const res = await apiCall('/billing/subscription');
      setSubscription(res?.data || res);
    } catch (err) {
      setSubscription({
        plan:         'starter',
        status:       'trialing',
        billingCycle: 'monthly',
        priceMonthly: 49,
        isActive:     true,
        isTrial:      true,
        trialDaysLeft:14,
        hasStripe:    false,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      const res = await apiCall('/billing/invoices');
      const data = res?.data || res || [];
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      setInvoices([]);
    }
  };

  useEffect(() => {
    loadSubscription();
    loadInvoices();

    // Handle success/cancel from Stripe redirect
    if (searchParams?.get('success') === 'true') {
      const plan = searchParams?.get('plan');
      toast.success(`🎉 Successfully upgraded to ${plan || 'new plan'}!`);
      loadSubscription();
    }
    if (searchParams?.get('cancelled') === 'true' || searchParams?.get('canceled') === 'true') {
      toast('Checkout cancelled — no charge made.');
    }
  }, [searchParams]);

  const handleUpgrade = async (planId: string) => {
    if (planId === 'enterprise') {
      window.location.href = 'mailto:sales@digitalhub.com?subject=Enterprise%20Plan%20Inquiry';
      return;
    }

    setUpgrading(planId);
    try {
      const res = await apiCall('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({
          planId,
          billingInterval: billingCycle,
          billingCycle,
        })
      });

      const data = res?.data || res;

      if (data?.type === 'stripe' && data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data?.type === 'mock' && data?.activated) {
        toast.success(`🎉 ${data.message}`);
        loadSubscription();
      } else if (data?.type === 'contact_sales') {
        toast(data.message || 'Contact sales for Enterprise');
      }
    } catch (err: any) {
      toast.error(err.message || 'Stripe is not configured yet. Add Stripe keys to enable checkout.');
    } finally {
      setUpgrading(null);
    }
  };

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await apiCall('/billing/portal', {
        method: 'POST',
      });
      const data = res?.data || res;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Could not load billing portal');
      }
    } catch (err: any) {
      toast.error(err.message || 'Stripe is not configured yet. Add Stripe keys to enable customer portal.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You will keep access until end of billing period.'))
      return;
    setCancelling(true);
    try {
      await apiCall('/billing/cancel', { method: 'POST' });
      toast.success('Subscription cancellation scheduled');
      loadSubscription();
    } catch (err) {
      toast.error('Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.success(`📄 Downloading invoice ${invoiceId}...`);
    // Create a mock download link
    const link = document.createElement('a');
    link.href = '#';
    link.setAttribute('download', `invoice_${invoiceId}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isCurrentPlan = (planId: string) => {
    return subscription?.plan === planId;
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 ml-[260px] min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 p-8 max-w-[1200px] mx-auto w-full">

            {/* PAGE HEADER */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-black text-slate-900">
                  Billing & Subscription
                </h1>
                <p className="text-slate-500 mt-1 text-sm font-medium">
                  Manage your plan and billing details
                </p>
              </div>
              {!subscription?.hasStripe && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle size={16} className="text-amber-600"/>
                  <span className="text-xs text-amber-700 font-black">
                    Demo Mode — Stripe not configured
                  </span>
                </div>
              )}
            </div>

            {/* CURRENT PLAN CARD */}
            {!loading && subscription && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-2xl">
                      {PLANS_CONFIG.find(p => p.id === subscription.plan)?.icon || '🚀'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-black text-slate-900">
                          {PLANS_CONFIG.find(p => p.id === subscription.plan)?.name || 'Starter'} Plan
                        </h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          subscription.status === 'active'
                            ? 'bg-green-100 text-green-700'
                          : subscription.status === 'trialing'
                            ? 'bg-blue-100 text-blue-700'
                          : subscription.status === 'past_due'
                            ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-600'
                        }`}>
                          {subscription.isTrial
                            ? `Trial — ${subscription.trialDaysLeft} days left`
                            : subscription.status.replace('_',' ')}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs font-semibold">
                        {subscription.billingCycle === 'annual'
                          ? 'Annual billing'
                          : 'Monthly billing'}
                        {subscription.priceMonthly > 0 &&
                          ` — $${subscription.priceMonthly}/month`}
                      </p>
                      {subscription.currentPeriodEnd && (
                        <p className="text-[10px] text-slate-400 font-bold mt-1">
                          {subscription.cancelAtPeriodEnd
                            ? '⚠️ Cancels on '
                            : 'Renews on '}
                          {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {subscription.stripeCustomerId ? (
                      <button
                        onClick={handleOpenPortal}
                        disabled={portalLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 disabled:opacity-50"
                      >
                        {portalLoading && <Loader2 size={12} className="animate-spin"/>}
                        Manage Subscription
                      </button>
                    ) : (
                      subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                        <button
                          onClick={handleCancel}
                          disabled={cancelling}
                          className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition-all hover:bg-slate-50 disabled:opacity-50"
                        >
                          {cancelling ? 'Cancelling...' : 'Cancel Plan'}
                        </button>
                      )
                    )}
                    <button
                      onClick={loadSubscription}
                      disabled={loading}
                      className="p-2 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-xl transition-all"
                    >
                      <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* BILLING CYCLE TOGGLE */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Annual
                <span className="px-2 py-0.5 bg-green-500 text-white rounded-full text-[9px] font-black tracking-normal uppercase">
                  2 months free
                </span>
              </button>
            </div>

            {/* PLAN CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {PLANS_CONFIG.map(plan => {
                const isCurrent = isCurrentPlan(plan.id);
                const isLoading = upgrading === plan.id;

                return (
                  <div key={plan.id}
                    className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md ${
                      isCurrent
                        ? 'border-indigo-500 ring-2 ring-indigo-500/10'
                        : 'border-slate-200'
                    }`}>

                    {/* Plan Header */}
                    <div className="p-6 pb-4">
                      {plan.badge && (
                        <div className="mb-3">
                          <span className="px-2.5 py-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[9px] font-black uppercase tracking-wider rounded-full">
                            {plan.badge}
                          </span>
                        </div>
                      )}

                      {isCurrent && (
                        <div className="mb-3">
                          <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-wider rounded-full">
                            ✓ Current Plan
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">
                          {plan.icon}
                        </span>
                        <h3 className="text-lg font-black text-slate-900">
                          {plan.name}
                        </h3>
                      </div>

                      <div className="mb-3">
                        {plan.price === 0 ? (
                          <div>
                            <p className="text-2xl font-black text-slate-900">
                              Custom
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Contact sales
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-2xl font-black text-slate-900">
                              {billingCycle === 'annual'
                                ? `$${Math.floor(plan.annualPrice/12)}`
                                : `$${plan.price}`}
                              <span className="text-sm font-normal text-slate-400">
                                /mo
                              </span>
                            </p>
                            {billingCycle === 'annual' && (
                              <p className="text-[10px] text-green-600 font-black uppercase tracking-wider mt-0.5">
                                ${plan.annualPrice}/year
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                        {plan.description}
                      </p>
                    </div>

                    {/* Features */}
                    <div className="px-6 pb-4 flex-1 space-y-2.5 mt-2">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {feature.included ? (
                            <Check size={14} className="text-green-600 flex-shrink-0"/>
                          ) : (
                            <X size={14} className="text-slate-300 flex-shrink-0"/>
                          )}
                          <span className={`text-[11px] font-medium ${
                            feature.included
                              ? 'text-slate-700'
                              : 'text-slate-400 line-through decoration-slate-200'
                          }`}>
                            {feature.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <div className="p-6 pt-4">
                      {isCurrent ? (
                        <div className="w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl font-black text-xs uppercase tracking-wider text-center">
                          ✓ Current Plan
                        </div>
                      ) : plan.id === 'enterprise' ? (
                        <button
                          onClick={() => handleUpgrade(plan.id)}
                          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all"
                        >
                          Contact Sales
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={!!upgrading}
                          className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                            isLoading
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10 disabled:opacity-50'
                          }`}
                        >
                          {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 size={12} className="animate-spin"/>
                              Processing...
                            </span>
                          ) : (
                            `Upgrade to ${plan.name}`
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* INVOICES SECTION */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <CreditCard size={18} className="text-indigo-600"/>
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">
                  Billing History
                </h3>
              </div>

              {invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        {['Date','Plan','Amount','Status','Invoice'].map(h => (
                          <th key={h} className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map(invoice => (
                        <tr key={invoice.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                            {new Date(invoice.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-xs font-black text-slate-900">
                            {invoice.plan}
                          </td>
                          <td className="px-6 py-4 text-xs font-black text-slate-900">
                            ${invoice.amount}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDownloadInvoice(invoice.id)}
                              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              Download
                              <ExternalLink size={12}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <CreditCard size={32} className="mx-auto mb-3 opacity-50"/>
                  <p className="text-xs font-bold uppercase tracking-wider">
                    No invoices yet
                  </p>
                </div>
              )}
            </div>

            {/* SECURITY NOTE */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <Shield size={20} className="text-slate-400 flex-shrink-0"/>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                All payments are processed securely by Stripe. We never store your card details.
                Cancel anytime from this page.
              </p>
            </div>

          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
          <p className="text-slate-500 font-semibold text-xs uppercase tracking-widest">Loading Billing Panel...</p>
        </div>
      </div>
    }>
      <BillingPageContent />
    </Suspense>
  );
}
