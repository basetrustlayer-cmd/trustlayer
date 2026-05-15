import { prisma } from "../db";

export type BillingLimitResult = {
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number | null;
};

export async function getOrganizationSubscriptionLimits(organizationId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: { plan: true }
  });

  if (!subscription) {
    return {
      subscription: null,
      plan: null,
      maxOrganizations: 1,
      maxDocuments: 0,
      includesTrustScore: false,
      includesBadge: false,
      includesApiAccess: false
    };
  }

  return {
    subscription,
    plan: subscription.plan,
    maxOrganizations: subscription.plan.maxOrganizations,
    maxDocuments: subscription.plan.maxDocuments,
    includesTrustScore: subscription.plan.includesTrustScore,
    includesBadge: subscription.plan.includesBadge,
    includesApiAccess: subscription.plan.includesApiAccess
  };
}

export async function assertDocumentUploadAllowed(organizationId: string): Promise<BillingLimitResult> {
  const limits = await getOrganizationSubscriptionLimits(organizationId);

  if (!limits.subscription || !limits.plan) {
    return {
      allowed: false,
      reason: "A paid subscription is required to upload compliance documents.",
      current: 0,
      limit: 0
    };
  }

  if (limits.maxDocuments === null) {
    return {
      allowed: true,
      current: 0,
      limit: null
    };
  }

  const current = await prisma.invoice.count({
    where: { organizationId }
  });

  if (current >= limits.maxDocuments) {
    return {
      allowed: false,
      reason: "Document upload limit reached for the current plan.",
      current,
      limit: limits.maxDocuments
    };
  }

  return {
    allowed: true,
    current,
    limit: limits.maxDocuments
  };
}

export async function assertOrganizationCreationAllowed(
  ownerOrganizationId: string
): Promise<BillingLimitResult> {
  const limits = await getOrganizationSubscriptionLimits(ownerOrganizationId);

  if (!limits.subscription || !limits.plan) {
    return {
      allowed: false,
      reason: "A paid subscription is required to create additional organizations.",
      current: 1,
      limit: 1
    };
  }

  if (limits.maxOrganizations === null) {
    return {
      allowed: true,
      current: 1,
      limit: null
    };
  }

  const current = 1;

  if (current >= limits.maxOrganizations) {
    return {
      allowed: false,
      reason: "Organization limit reached for the current plan.",
      current,
      limit: limits.maxOrganizations
    };
  }

  return {
    allowed: true,
    current,
    limit: limits.maxOrganizations
  };
}

export async function assertTrustScoreAccessAllowed(
  organizationId: string
): Promise<BillingLimitResult> {
  const limits = await getOrganizationSubscriptionLimits(organizationId);

  if (!limits.includesTrustScore) {
    return {
      allowed: false,
      reason: "TrustScore access is not included in the current plan.",
      current: 0,
      limit: null
    };
  }

  return {
    allowed: true,
    current: 0,
    limit: null
  };
}

export async function assertBadgeAccessAllowed(
  organizationId: string
): Promise<BillingLimitResult> {
  const limits = await getOrganizationSubscriptionLimits(organizationId);

  if (!limits.includesBadge) {
    return {
      allowed: false,
      reason: "Trust badge access is not included in the current plan.",
      current: 0,
      limit: null
    };
  }

  return {
    allowed: true,
    current: 0,
    limit: null
  };
}
