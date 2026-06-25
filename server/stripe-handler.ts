import Stripe from "stripe";
import type { Express, Request, Response } from "express";
import { ENV } from "./_core/env";
import * as db from "./db";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!_stripe && ENV.stripeSecretKey) {
    _stripe = new Stripe(ENV.stripeSecretKey, { apiVersion: "2025-04-30.basil" as any });
  }
  return _stripe;
}

export function registerStripeRoutes(app: Express) {
  // Webhook endpoint - must be registered with raw body parser
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    const sig = req.headers["stripe-signature"] as string;
    if (!sig) {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        ENV.stripeWebhookSecret || ""
      );
    } catch (err: any) {
      console.error("[Stripe Webhook] Signature verification failed:", err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle test events
    if (event.id.startsWith("evt_test_")) {
      console.log("[Stripe Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.user_id;
          const planKey = session.metadata?.plan_key;
          if (userId && session.subscription) {
            await db.updateUserStripe(parseInt(userId), {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              subscriptionPlan: planKey || "starter",
              subscriptionStatus: "active",
            });
          }
          break;
        }
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const user = await db.getUserByStripeCustomerId(customerId);
          if (user) {
            await db.updateUserStripe(user.id, {
              subscriptionStatus: subscription.status === "active" ? "active" : "inactive",
            });
          }
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const user = await db.getUserByStripeCustomerId(customerId);
          if (user) {
            await db.updateUserStripe(user.id, {
              subscriptionStatus: "cancelled",
              stripeSubscriptionId: null,
            });
          }
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;
          const user = await db.getUserByStripeCustomerId(customerId);
          if (user) {
            await db.updateUserStripe(user.id, {
              subscriptionStatus: "past_due",
            });
          }
          break;
        }
      }
    } catch (err) {
      console.error("[Stripe Webhook] Error processing event:", err);
    }

    res.json({ received: true });
  });
}

/**
 * Create a Stripe Checkout Session for subscription
 */
export async function createCheckoutSession(opts: {
  userId: number;
  userEmail: string;
  userName: string;
  planKey: string;
  priceAmount: number;
  planName: string;
  interval: "month" | "year";
  origin: string;
}): Promise<string> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe not configured");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: opts.userEmail,
    allow_promotion_codes: true,
    client_reference_id: opts.userId.toString(),
    metadata: {
      user_id: opts.userId.toString(),
      customer_email: opts.userEmail,
      customer_name: opts.userName,
      plan_key: opts.planKey,
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `SpeedLead ${opts.planName} Plan`,
            description: `${opts.planName} subscription - AI-powered lead response`,
          },
          unit_amount: opts.priceAmount,
          recurring: { interval: opts.interval },
        },
        quantity: 1,
      },
    ],
    success_url: `${opts.origin}/billing?success=true`,
    cancel_url: `${opts.origin}/billing?cancelled=true`,
  });

  return session.url!;
}

/**
 * Create a Stripe Customer Portal session for managing subscription
 */
export async function createPortalSession(stripeCustomerId: string, origin: string): Promise<string> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe not configured");

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${origin}/billing`,
  });

  return session.url;
}
