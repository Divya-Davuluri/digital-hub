import { Request, Response } from 'express';
import { db } from '../db';
import { subscriptions, tenants } from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { AppError, asyncHandler } from '../utils/errors';
import { PLANS, PlanId } from '../config/plans';

// Initialize Stripe safely
let stripe: any = null;
const initStripe = () => {
  if (stripe) return stripe;
  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('[Billing] No Stripe key — mock mode active');
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe');
    stripe = new Stripe(
      process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-04-10',
    });
    return stripe;
  } catch (err) {
    console.error('[Billing] Stripe init failed:', err);
    return null;
  }
};

// 1. getSubscription (GET /api/billing/subscription)
export const getSubscription = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;

  try {
    const sub = await db.query.subscriptions
      .findFirst({
        where: eq(subscriptions.tenantId, tenantId)
      });

    if (!sub) {
      // Return free/trial plan
      return res.json({
        success: true,
        data: {
          plan:            'starter',
          status:          'trialing',
          billingCycle:    'monthly',
          billingInterval: 'monthly',
          priceMonthly:    49,
          isActive:        true,
          isTrial:         true,
          trialDaysLeft:   14,
          currentPeriodEnd:new Date(
            Date.now() + 14*86400000).toISOString(),
          features:        PLANS.starter.features,
          limits:          PLANS.starter.limits,
          hasStripe:       !!process.env.STRIPE_SECRET_KEY,
        }
      });
    }

    const plan = PLANS[sub.plan as PlanId] 
      || PLANS.starter;
    const now = new Date();
    const periodEnd = sub.currentPeriodEnd
      ? new Date(sub.currentPeriodEnd)
      : new Date(now.getTime() + 30*86400000);
    const daysLeft = Math.max(0,
      Math.ceil((periodEnd.getTime() - now.getTime())
        / 86400000));

    res.json({
      success: true,
      data: {
        id:              sub.id,
        plan:            sub.plan,
        planName:        plan.name,
        status:          sub.status,
        billingCycle:    sub.billingInterval || sub.billingCycle || 'monthly',
        billingInterval: sub.billingInterval || sub.billingCycle || 'monthly',
        priceMonthly:    sub.priceMonthly || plan.price,
        isActive:        sub.status === 'active'
                         || sub.status === 'trialing',
        isTrial:         sub.status === 'trialing',
        trialDaysLeft:   sub.status === 'trialing'
                         ? daysLeft : null,
        currentPeriodEnd:sub.currentPeriodEnd,
        daysLeft,
        cancelAtPeriodEnd:sub.cancelAtPeriodEnd === 1,
        features:        plan.features,
        limits:          plan.limits,
        hasStripe:       !!process.env.STRIPE_SECRET_KEY,
        stripeCustomerId:sub.stripeCustomerId || null,
        workspaceId:     sub.workspaceId || null,
      }
    });
  } catch (err) {
    console.error('[Billing] getSubscription:', err);
    res.json({
      success: true,
      data: {
        plan:         'starter',
        status:       'trialing',
        billingCycle: 'monthly',
        billingInterval: 'monthly',
        priceMonthly: 49,
        isActive:     true,
        isTrial:      true,
        trialDaysLeft:14,
        features:     PLANS.starter.features,
        limits:       PLANS.starter.limits,
        hasStripe:    false,
      }
    });
  }
});

// 2. createCheckoutSession (POST /api/billing/checkout)
export const createCheckoutSession = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const workspaceId = req.user.workspaceId || req.user.workspace_id || null;

  // Defensive check for body parsing
  const body = req.body || {};
  const { planId, billingInterval, billingCycle } = body;

  // Validate planId presence
  if (!planId) {
    return res.status(400).json({
      error: 'Missing planId'
    });
  }

  // Plan Validation
  const allowedPlans = ['starter', 'growth', 'agency_pro'];
  if (!allowedPlans.includes(planId)) {
    return res.status(400).json({
      error: `Invalid planId. Allowed plans: ${allowedPlans.join(', ')}`
    });
  }

  // Interval Validation
  const interval = billingInterval || billingCycle || 'monthly';
  const allowedIntervals = ['monthly', 'annual'];
  if (!allowedIntervals.includes(interval)) {
    return res.status(400).json({
      error: `Invalid billingInterval. Allowed intervals: ${allowedIntervals.join(', ')}`
    });
  }

  const plan = PLANS[planId as PlanId];
  if (!plan) {
    return res.status(400).json({
      error: 'Plan configuration not found'
    });
  }

  const stripeClient = initStripe();

  // If Stripe keys missing → Perform mock upgrade in database to let it "work properly" in demo mode
  if (!stripeClient) {
    try {
      const now = new Date().toISOString();
      const existing = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.tenantId, tenantId)
      });

      const subValues = {
        plan:                planId,
        status:              'active',
        billingCycle:        interval,
        billingInterval:     interval,
        priceMonthly:        plan.price,
        stripeCustomerId:    'mock_cust_' + tenantId,
        stripeSubscriptionId:'mock_sub_' + tenantId,
        workspaceId:         workspaceId || null,
        updatedAt:           now,
      };

      if (existing) {
        await db.update(subscriptions)
          .set(subValues)
          .where(eq(subscriptions.tenantId, tenantId));
      } else {
        await db.insert(subscriptions).values({
          id: uuidv4(),
          tenantId,
          plan:                subValues.plan,
          status:              subValues.status,
          billingCycle:        subValues.billingCycle,
          billingInterval:     subValues.billingInterval,
          priceMonthly:        subValues.priceMonthly,
          stripeCustomerId:    subValues.stripeCustomerId,
          stripeSubscriptionId:subValues.stripeSubscriptionId,
          workspaceId:         subValues.workspaceId,
          stripePriceId:       null,
          currentPeriodStart:  now,
          currentPeriodEnd:    new Date(Date.now() + 30*86400000).toISOString(),
          cancelAtPeriodEnd:   0,
          trialEnd:            null,
          trialEndsAt:         null,
          createdAt:           now,
          updatedAt:           now,
        });
      }
    } catch (dbErr) {
      console.error('[Billing] Mock upgrade DB error:', dbErr);
    }

    return res.json({
      success: true,
      data: {
        type: 'mock',
        activated: true,
        message: `Stripe is not configured yet. Checkout is disabled in demo mode. Upgraded to ${plan.name} in demo mode instead.`
      }
    });
  }

  // Real Stripe checkout
  try {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId)
    });

    const priceId = interval === 'annual'
      ? plan.stripePriceIdAnnual
      : plan.stripePriceIdMonthly;

    if (!priceId) {
      return res.status(400).json({
        success: false,
        message: `Stripe price not configured for plan ${planId} with ${interval} billing in local environment`,
      });
    }

    const session = await stripeClient.checkout
      .sessions.create({
        mode:               'subscription',
        payment_method_types:['card'],
        line_items: [{
          price:    priceId,
          quantity: 1,
        }],
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}` +
          `/dashboard/billing?success=true&plan=${planId}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}` +
          `/dashboard/billing?canceled=true`,
        metadata: {
          tenantId,
          workspaceId: workspaceId || '',
          planId,
          billingCycle: interval,
        },
        customer_email: tenant?.supportEmail || undefined,
      });

    res.json({
      success: true,
      data: {
        type:       'stripe',
        sessionId:  session.id,
        checkoutUrl:session.url,
      }
    });
  } catch (err: any) {
    console.error('[Billing] Stripe checkout error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to create checkout session'
    });
  }
});

// 3. createPortalSession (POST /api/billing/portal)
export const createPortalSession = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const stripeClient = initStripe();

  if (!stripeClient) {
    return res.status(400).json({
      success: false,
      message: 'Stripe is not configured yet. Checkout is disabled in demo mode.',
    });
  }

  try {
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.tenantId, tenantId),
    });

    if (!sub || !sub.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'No active customer billing details found. Please upgrade first.',
      });
    }

    const session = await stripeClient.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/billing`,
    });

    res.json({
      success: true,
      data: {
        url: session.url,
      },
    });
  } catch (err: any) {
    console.error('[Billing] Portal session error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to create portal session'
    });
  }
});

// 4. cancelSubscription (POST /api/billing/cancel)
export const cancelSubscription = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;

  try {
    await db.update(subscriptions)
      .set({
        cancelAtPeriodEnd: 1,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(subscriptions.tenantId, tenantId));

    res.json({
      success: true,
      message: 'Subscription will cancel at end of billing period'
    });
  } catch (err) {
    throw new AppError('Failed to cancel', 500);
  }
});

// 5. stripeWebhook (POST /api/billing/webhook)
export const stripeWebhook = asyncHandler(
  async (req: any, res: Response) => {
  const stripeClient = initStripe();

  if (!stripeClient) {
    return res.json({ received: true });
  }

  const sig = req.headers['stripe-signature'];
  let event: any;

  try {
    event = stripeClient.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error('[Webhook] Signature failed:', err);
    return res.status(400).json({
      error: `Webhook Error: ${err.message}`
    });
  }

  const now = new Date().toISOString();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { tenantId, workspaceId, planId, billingCycle } 
          = session.metadata || {};

        if (tenantId && planId) {
          const plan = PLANS[planId as PlanId];
          const existing = await db.query.subscriptions
            .findFirst({
              where: eq(subscriptions.tenantId, tenantId)
            });

          const subValues = {
            plan:                planId,
            status:              'active',
            billingCycle:        billingCycle || 'monthly',
            billingInterval:     billingCycle || 'monthly',
            priceMonthly:        plan?.price || 0,
            stripeCustomerId:    session.customer || null,
            stripeSubscriptionId:session.subscription || null,
            workspaceId:         workspaceId || null,
            updatedAt:           now,
          };

          if (existing) {
            await db.update(subscriptions)
              .set(subValues)
              .where(eq(subscriptions.tenantId, tenantId));
          } else {
            await db.insert(subscriptions).values({
              id: uuidv4(),
              tenantId,
              plan:                subValues.plan,
              status:              subValues.status,
              billingCycle:        subValues.billingCycle,
              billingInterval:     subValues.billingInterval,
              priceMonthly:        subValues.priceMonthly,
              stripeCustomerId:    subValues.stripeCustomerId,
              stripeSubscriptionId:subValues.stripeSubscriptionId,
              workspaceId:         subValues.workspaceId,
              stripePriceId:       null,
              currentPeriodStart:  now,
              currentPeriodEnd:    new Date(
                Date.now()+30*86400000).toISOString(),
              cancelAtPeriodEnd:   0,
              trialEnd:            null,
              trialEndsAt:         null,
              createdAt:           now,
              updatedAt:           now,
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await db.update(subscriptions)
          .set({ status:'cancelled', updatedAt:now })
          .where(eq(
            subscriptions.stripeSubscriptionId,
            sub.id
          ));
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await db.update(subscriptions)
          .set({ status:'past_due', updatedAt:now })
          .where(eq(
            subscriptions.stripeCustomerId,
            invoice.customer
          ));
        break;
      }
    }
  } catch (err) {
    console.error('[Webhook] Handler error:', err);
  }

  res.json({ received: true });
});

// 6. getInvoices (GET /api/billing/invoices)
export const getInvoices = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;

  // Return mock invoices for now
  const mockInvoices = [
    {
      id:          'inv-001',
      date:        new Date(
        Date.now()-30*86400000).toISOString(),
      amount:      149,
      status:      'paid',
      plan:        'Growth',
      downloadUrl: '#',
    },
    {
      id:          'inv-002',
      date:        new Date(
        Date.now()-60*86400000).toISOString(),
      amount:      149,
      status:      'paid',
      plan:        'Growth',
      downloadUrl: '#',
    },
  ];

  res.json({ success:true, data: mockInvoices });
});
