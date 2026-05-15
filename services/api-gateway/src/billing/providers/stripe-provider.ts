import Stripe from "stripe";
import { prisma } from "@trustlayer/database";

export type CreateStripeCheckoutInput = {
  organizationId: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
};

function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is required.");
  }

  return new Stripe(secretKey);
}

export async function createStripeCheckoutSession(input: CreateStripeCheckoutInput) {
  const stripe = getStripe();

  const organization = await prisma.organization.findUnique({
    where: { id: input.organizationId }
  });

  if (!organization) {
    throw new Error("Organization not found.");
  }

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: input.planId }
  });

  if (!plan) {
    throw new Error("Subscription plan not found.");
  }

  if (!plan.externalPriceId) {
    throw new Error("Subscription plan is missing externalPriceId for Stripe.");
  }

  const customer = await stripe.customers.create({
    name: organization.name,
    metadata: {
      organizationId: organization.id
    }
  });

  const session = await stripe.checkout.sessions.create({
    mode: plan.interval === "ONE_TIME" ? "payment" : "subscription",
    customer: customer.id,
    line_items: [
      {
        price: plan.externalPriceId,
        quantity: 1
      }
    ],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: {
      organizationId: organization.id,
      planId: plan.id
    }
  });

  return {
    checkoutSessionId: session.id,
    checkoutUrl: session.url,
    stripeCustomerId: customer.id
  };
}
