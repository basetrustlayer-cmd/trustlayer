import { randomUUID } from "crypto";
import {
  prisma,
  PaymentProvider,
  SubscriptionStatus
} from "@trustlayer/database";

export type CreateHubtelCheckoutInput = {
  organizationId: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
};

export type HubtelWebhookPayload = {
  organizationId: string;
  planId: string;
  status: "SUCCESS" | "FAILED";
  customerReference?: string;
  transactionId?: string;
};

function getHubtelConfig() {
  const clientId = process.env.HUBTEL_CLIENT_ID;
  const clientSecret = process.env.HUBTEL_CLIENT_SECRET;
  const merchantAccountNumber =
    process.env.HUBTEL_MERCHANT_ACCOUNT_NUMBER;

  if (!clientId) {
    throw new Error("HUBTEL_CLIENT_ID is required.");
  }

  if (!clientSecret) {
    throw new Error("HUBTEL_CLIENT_SECRET is required.");
  }

  if (!merchantAccountNumber) {
    throw new Error("HUBTEL_MERCHANT_ACCOUNT_NUMBER is required.");
  }

  const checkoutUrl = process.env.HUBTEL_CHECKOUT_URL;

  if (!checkoutUrl) {
    throw new Error("HUBTEL_CHECKOUT_URL is required.");
  }

  return {
    clientId,
    clientSecret,
    merchantAccountNumber,
    checkoutUrl
  };
}

export async function createHubtelCheckoutSession(
  input: CreateHubtelCheckoutInput
) {
  const config = getHubtelConfig();

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

  const checkoutId = randomUUID();

  const response = await fetch(config.checkoutUrl, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      merchantAccountNumber: config.merchantAccountNumber,
      clientReference: checkoutId,
      description: `TrustLayer subscription for ${organization.name}`,
      amount: plan.priceCents / 100,
      currency: plan.currency,
      callbackUrl: input.successUrl,
      cancellationUrl: input.cancelUrl,
      metadata: {
        organizationId: input.organizationId,
        planId: input.planId
      }
    })
  });

  const payload = await response.json().catch(() => null) as {
    checkoutUrl?: string;
    paymentUrl?: string;
    url?: string;
    data?: {
      checkoutUrl?: string;
      paymentUrl?: string;
      url?: string;
      checkoutId?: string;
      clientReference?: string;
    };
  } | null;

  if (!response.ok) {
    throw new Error("Hubtel checkout request failed.");
  }

  const resolvedCheckoutUrl =
    payload?.checkoutUrl ??
    payload?.paymentUrl ??
    payload?.url ??
    payload?.data?.checkoutUrl ??
    payload?.data?.paymentUrl ??
    payload?.data?.url;

  const resolvedReference =
    payload?.data?.checkoutId ??
    payload?.data?.clientReference ??
    checkoutId;

  if (!resolvedCheckoutUrl) {
    throw new Error("Hubtel checkout response did not include a checkout URL.");
  }

  return {
    checkoutSessionId: resolvedReference,
    checkoutUrl: resolvedCheckoutUrl,
    hubtelReference: resolvedReference
  };
}

export async function handleHubtelWebhook(
  payload: HubtelWebhookPayload
): Promise<void> {
  if (payload.status !== "SUCCESS") {
    return;
  }

  const existing = payload.transactionId
    ? await prisma.subscription.findFirst({
        where: {
          provider: PaymentProvider.HUBTEL,
          externalSubscriptionId: payload.transactionId
        }
      })
    : null;

  if (existing) {
    return;
  }

  const now = new Date();

  await prisma.subscription.upsert({
    where: {
      organizationId: payload.organizationId
    },
    create: {
      organizationId: payload.organizationId,
      planId: payload.planId,
      provider: PaymentProvider.HUBTEL,
      status: SubscriptionStatus.ACTIVE,
      externalCustomerId:
        payload.customerReference ?? null,
      externalSubscriptionId:
        payload.transactionId ?? null,
      currentPeriodStart: now
    },
    update: {
      planId: payload.planId,
      provider: PaymentProvider.HUBTEL,
      status: SubscriptionStatus.ACTIVE,
      externalCustomerId:
        payload.customerReference ?? null,
      externalSubscriptionId:
        payload.transactionId ?? null,
      currentPeriodStart: now
    }
  });
}
