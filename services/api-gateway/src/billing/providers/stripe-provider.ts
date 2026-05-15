import Stripe from "stripe";
import {
  prisma,
  InvoiceStatus,
  PaymentProvider,
  PaymentStatus,
  SubscriptionStatus
} from "@trustlayer/database";

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

function getStripeWebhookSecret(): string {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is required.");
  }

  return webhookSecret;
}

function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return SubscriptionStatus.TRIALING;
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "past_due":
      return SubscriptionStatus.PAST_DUE;
    case "canceled":
      return SubscriptionStatus.CANCELED;
    case "unpaid":
      return SubscriptionStatus.UNPAID;
    case "incomplete_expired":
      return SubscriptionStatus.EXPIRED;
    default:
      return SubscriptionStatus.PAST_DUE;
  }
}

function mapStripeInvoiceStatus(status: Stripe.Invoice.Status | null): InvoiceStatus {
  switch (status) {
    case "draft":
      return InvoiceStatus.DRAFT;
    case "open":
      return InvoiceStatus.OPEN;
    case "paid":
      return InvoiceStatus.PAID;
    case "void":
      return InvoiceStatus.VOID;
    case "uncollectible":
      return InvoiceStatus.UNCOLLECTIBLE;
    default:
      return InvoiceStatus.OPEN;
  }
}

function unixToDate(value: number | null | undefined): Date | null {
  return typeof value === "number" ? new Date(value * 1000) : null;
}

function getId(value: string | { id: string } | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

export async function createStripeCheckoutSession(input: CreateStripeCheckoutInput) {
  const stripe = getStripe();

  const organization = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    include: { subscription: true }
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

  const existingCustomerId =
    organization.subscription?.provider === PaymentProvider.STRIPE
      ? organization.subscription.externalCustomerId
      : null;

  const customerId =
    existingCustomerId ??
    (
      await stripe.customers.create({
        name: organization.name,
        metadata: {
          organizationId: organization.id
        }
      })
    ).id;

  const session = await stripe.checkout.sessions.create({
    mode: plan.interval === "ONE_TIME" ? "payment" : "subscription",
    customer: customerId,
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
    stripeCustomerId: customerId
  };
}

export function constructStripeWebhookEvent(
  payload: Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe();

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    getStripeWebhookSecret()
  );
}

export async function handleStripeWebhookEvent(
  event: Stripe.Event
): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session
      );
      return;

    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handleSubscriptionChanged(
        event.data.object as Stripe.Subscription
      );
      return;

    case "invoice.payment_succeeded":
      await handleInvoicePaymentSucceeded(
        event.data.object as Stripe.Invoice
      );
      return;

    default:
      return;
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const organizationId = session.metadata?.organizationId;
  const planId = session.metadata?.planId;
  const customerId = getId(session.customer);
  const stripeSubscriptionId = getId(session.subscription);

  if (!organizationId || !planId || !customerId) {
    return;
  }

  await prisma.subscription.upsert({
    where: { organizationId },
    create: {
      organizationId,
      planId,
      provider: PaymentProvider.STRIPE,
      status: SubscriptionStatus.ACTIVE,
      externalCustomerId: customerId,
      externalSubscriptionId: stripeSubscriptionId
    },
    update: {
      planId,
      provider: PaymentProvider.STRIPE,
      status: SubscriptionStatus.ACTIVE,
      externalCustomerId: customerId,
      externalSubscriptionId: stripeSubscriptionId
    }
  });
}

async function handleSubscriptionChanged(
  subscription: Stripe.Subscription
): Promise<void> {
  const organizationId = subscription.metadata?.organizationId;
  const planId = subscription.metadata?.planId;
  const customerId = getId(subscription.customer);

  if (!organizationId || !planId || !customerId) {
    return;
  }

  await prisma.subscription.upsert({
    where: { organizationId },
    create: {
      organizationId,
      planId,
      provider: PaymentProvider.STRIPE,
      status: mapStripeSubscriptionStatus(subscription.status),
      externalCustomerId: customerId,
      externalSubscriptionId: subscription.id,
      trialEndsAt: unixToDate(subscription.trial_end),
      canceledAt: unixToDate(subscription.canceled_at)
    },
    update: {
      planId,
      provider: PaymentProvider.STRIPE,
      status: mapStripeSubscriptionStatus(subscription.status),
      externalCustomerId: customerId,
      externalSubscriptionId: subscription.id,
      trialEndsAt: unixToDate(subscription.trial_end),
      canceledAt: unixToDate(subscription.canceled_at)
    }
  });
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<void> {
  const stripeSubscriptionId = getId((invoice as any).subscription);
  const customerId = getId(invoice.customer);

  if (!stripeSubscriptionId || !customerId) {
    return;
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      externalSubscriptionId: stripeSubscriptionId,
      externalCustomerId: customerId,
      provider: PaymentProvider.STRIPE
    }
  });

  if (!subscription) {
    return;
  }

  const invoiceNumber = invoice.number ?? invoice.id;
  const amountPaid = invoice.amount_paid ?? invoice.total ?? 0;
  const subtotal = invoice.subtotal ?? amountPaid;
  const total = invoice.total ?? amountPaid;
  const paidAt = unixToDate(invoice.status_transitions?.paid_at);
  const currency = (invoice.currency || "USD").toUpperCase();

  const invoiceRecord = await prisma.invoice.upsert({
    where: {
      invoiceNumber
    },
    create: {
      subscriptionId: subscription.id,
      organizationId: subscription.organizationId,
      invoiceNumber,
      status: mapStripeInvoiceStatus(invoice.status),
      subtotalCents: subtotal,
      taxCents: 0,
      totalCents: total,
      currency,
      externalInvoiceId: invoice.id,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      dueDate: unixToDate(invoice.due_date),
      paidAt
    },
    update: {
      status: mapStripeInvoiceStatus(invoice.status),
      subtotalCents: subtotal,
      taxCents: 0,
      totalCents: total,
      currency,
      externalInvoiceId: invoice.id,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      dueDate: unixToDate(invoice.due_date),
      paidAt
    }
  });

  await prisma.payment.upsert({
    where: {
      reference: invoice.id
    },
    create: {
      invoiceId: invoiceRecord.id,
      organizationId: subscription.organizationId,
      provider: PaymentProvider.STRIPE,
      externalPaymentId: null,
      reference: invoice.id,
      amountCents: amountPaid,
      currency,
      status: PaymentStatus.SUCCEEDED,
      paidAt,
      metadata: {
        stripeInvoiceId: invoice.id,
        stripeSubscriptionId,
        stripeCustomerId: customerId
      }
    },
    update: {
      amountCents: amountPaid,
      currency,
      status: PaymentStatus.SUCCEEDED,
      paidAt,
      metadata: {
        stripeInvoiceId: invoice.id,
        stripeSubscriptionId,
        stripeCustomerId: customerId
      }
    }
  });
}
