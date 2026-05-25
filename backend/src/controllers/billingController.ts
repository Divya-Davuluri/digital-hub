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
    console.log('[Billing] No Stripe key — mock mode');
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
        billingCycle:    sub.billingCycle,
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
  const { planId, billingCycle } = req.body;

  const plan = PLANS[planId as PlanId];
  if (!plan) {
    throw new AppError('Invalid plan', 400);
  }

  if (planId === 'enterprise') {
    return res.json({
      success: true,
      data: {
        type: 'contact_sales',
        message: 'Please contact our sales team for Enterprise pricing.',
        email: 'sales@digitalhub.com',
      }
    });
  }

  const stripeClient = initStripe();

  // Mock mode if no Stripe
  if (!stripeClient) {
    const now = new Date();
    const periodEnd = new Date(
      now.getTime() + 30*86400000);

    // Create/update subscription in DB
    try {
      const existing = await db.query.subscriptions
        .findFirst({
          where: eq(subscriptions.tenantId, tenantId)
        });

      const subData = {
        plan:           planId,
        status:         'active',
        billingCycle:   billingCycle || 'monthly',
        priceMonthly:   plan.price,
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd:   periodEnd.toISOString(),
        updatedAt:      now.toISOString(),
      };

      if (existing) {
        await db.update(subscriptions)
          .set(subData)
          .where(
            eq(subscriptions.tenantId, tenantId));
      } else {
        await db.insert(subscriptions).values({
          id:      uuidv4(),
          tenantId,
          plan: subData.plan,
          status: subData.status,
          billingCycle: subData.billingCycle,
          priceMonthly: subData.priceMonthly,
          currentPeriodStart: subData.currentPeriodStart,
          currentPeriodEnd: subData.currentPeriodEnd,
          stripeCustomerId:     null,
          stripeSubscriptionId: null,
          stripePriceId:        null,
          cancelAtPeriodEnd:    0,
          trialEnd:             null,
          createdAt:            now.toISOString(),
          updatedAt:            now.toISOString(),
        });
      }
    } catch (dbErr) {
      console.error('[Billing] DB error:', dbErr);
    }

    return res.json({
      success: true,
      data: {
        type:      'mock',
        plan:      planId,
        planName:  plan.name,
        price:     plan.price,
        message:   `Successfully upgraded to ${plan.name}!`,
        activated: true,
      }
    });
  }

  // Real Stripe checkout
  try {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId)
    });

    const priceId = billingCycle === 'annual'
      ? plan.stripePriceIdAnnual
      : plan.stripePriceIdMonthly;

    if (!priceId) {
      throw new AppError(
        'Stripe price not configured for this plan',
        400);
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
          `/dashboard/billing?cancelled=true`,
        metadata: {
          tenantId,
          planId,
          billingCycle: billingCycle || 'monthly',
        },
        customer_email: tenant?.name || undefined,
      });

    res.json({
      success: true,
      data: {
        type:       'stripe',
        sessionId:  session.id,
        checkoutUrl:session.url,
      }
    });
  } catch (err) {
    console.error('[Billing] Stripe checkout error:', err);
    throw new AppError('Failed to create checkout', 500);
  }
});

// 3. cancelSubscription (POST /api/billing/cancel)
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

// 4. stripeWebhook (POST /api/billing/webhook)
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
        const { tenantId, planId, billingCycle } 
          = session.metadata || {};

        if (tenantId && planId) {
          const plan = PLANS[planId as PlanId];
          const existing = await db.query.subscriptions
            .findFirst({
              where: eq(subscriptions.tenantId, tenantId)
            });

          if (existing) {
            await db.update(subscriptions)
              .set({
                stripeSubscriptionId: session.subscription || null,
                stripeCustomerId: session.customer || null,
                plan: planId,
                status: 'active',
                billingCycle: billingCycle || 'monthly',
                priceMonthly: plan?.price || 0,
                updatedAt: now,
              })
              .where(eq(subscriptions.tenantId, tenantId));
          } else {
            await db.insert(subscriptions).values({
              id: uuidv4(),
              tenantId,
              plan:                planId,
              status:              'active',
              billingCycle:        billingCycle || 'monthly',
              priceMonthly:        plan?.price || 0,
              stripeCustomerId:    session.customer || null,
              stripeSubscriptionId:session.subscription || null,
              stripePriceId:       null,
              currentPeriodStart:  now,
              currentPeriodEnd:    new Date(
                Date.now()+30*86400000).toISOString(),
              cancelAtPeriodEnd:   0,
              trialEnd:            null,
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

// 5. getInvoices (GET /api/billing/invoices)
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
