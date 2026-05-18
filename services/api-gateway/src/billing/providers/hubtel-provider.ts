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

  return {
    clientId,
    clientSecret,
    merchantAccountNumber
  };
}

export async function createHubtelCheckoutSession(
  input: CreateHubtelCheckoutInput
) {
  getHubtelConfig();

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

  const checkoutUrl =
    `${input.successUrl}` +
    `?provider=hubtel` +
    `&checkoutId=${encodeURIComponent(checkoutId)}` +
    `&organizationId=${encodeURIComponent(input.organizationId)}` +
    `&planId=${encodeURIComponent(input.planId)}`;

  return {
    checkoutSessionId: checkoutId,
    checkoutUrl,
    hubtelReference: checkoutId
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
