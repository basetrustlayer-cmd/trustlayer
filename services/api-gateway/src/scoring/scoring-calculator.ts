const TIER_CEILINGS = {
  UNVERIFIED: 30,
  INDIVIDUAL: 65,
  BUSINESS: 85,
  ENHANCED: 100
} as const;

export type VerificationTier = keyof typeof TIER_CEILINGS;
export const PROJECTION_TTL_SECONDS: Record<VerificationTier, number> = {
  UNVERIFIED: 21_600,
  INDIVIDUAL: 86_400,
  BUSINESS:   604_800,
  ENHANCED:   2_592_000,
} as const;

export function getProjectionTtl(tier: VerificationTier): number {
  return PROJECTION_TTL_SECONDS[tier];
}


export type ScoreRole =
  | "seller"
  | "buyer"
  | "worker"
  | "hirer"
  | "platform";

export type TrustScoreFactors = {
  identity: number;
  transactions: number;
  reviews: number;
  disputes: number;
  roleSpecific: number;
};

export type TrustScoreCalculationInput = {
  subjectId: string;
  role?: ScoreRole;
  identityVerified?: boolean;
  verificationCount?: number;
  transactionCount?: number;
  positiveReviewCount?: number;
  negativeReviewCount?: number;
  disputeCount?: number;
  confirmedFraudFlag?: boolean;
  confirmedFraudSeverity?: "low" | "high";
  verificationTier?: string | null;
  lastActivityAt?: Date | string | null;
  reason?: string;
};

export type ConsumerTier = "NEW" | "BUILDING" | "VERIFIED" | "TRUSTED";

export type TrustScoreCalculationResult = {
  subjectId: string;
  role: ScoreRole;
  score: number;
  tier: string;
  tierCeiling: number;
  confidence: number;
  factors: TrustScoreFactors;
  verificationTier: VerificationTier;
  consumerTier: ConsumerTier;
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeTier(value?: string | null): VerificationTier {
  if (
    value === "UNVERIFIED" ||
    value === "INDIVIDUAL" ||
    value === "BUSINESS" ||
    value === "ENHANCED"
  ) {
    return value;
  }

  return "UNVERIFIED";
}

function getTrustScoreBand(score: number): string {
  if (score >= 85) return "high_trust";
  if (score >= 70) return "good_standing";
  if (score >= 50) return "fair";
  if (score >= 30) return "low";
  return "unscored";
}

export function mapToConsumerTier(verificationTier: VerificationTier, scoreBand: string): ConsumerTier {
  if (verificationTier === "ENHANCED") {
    return "TRUSTED";
  }

  if (verificationTier === "BUSINESS" || verificationTier === "INDIVIDUAL") {
    return "VERIFIED";
  }

  if (verificationTier === "UNVERIFIED") {
    if (scoreBand === "unscored") {
      return "NEW";
    }
    if (scoreBand === "low" || scoreBand === "fair") {
      return "BUILDING";
    }
    if (scoreBand === "good_standing" || scoreBand === "high_trust") {
      return "VERIFIED";
    }
  }

  return "NEW";
}

function calculateConfidence(input: TrustScoreCalculationInput): number {
  let confidence = 0.25;

  if (input.identityVerified) confidence += 0.3;
  if ((input.verificationCount ?? 0) > 0) confidence += 0.15;
  if ((input.transactionCount ?? 0) >= 5) confidence += 0.15;

  const reviewCount =
    (input.positiveReviewCount ?? 0) +
    (input.negativeReviewCount ?? 0);

  if (reviewCount >= 3) confidence += 0.1;

  return Number(clamp(confidence, 0.1, 0.95).toFixed(2));
}

function calculateInactivityPenalty(
  lastActivityAt?: Date | string | null
): number {
  if (!lastActivityAt) {
    return 0;
  }

  const activityDate =
    lastActivityAt instanceof Date
      ? lastActivityAt
      : new Date(lastActivityAt);

  if (Number.isNaN(activityDate.getTime())) {
    return 0;
  }

  const daysInactive =
    (Date.now() - activityDate.getTime()) /
    (1000 * 60 * 60 * 24);

  if (daysInactive <= 90) {
    return 0;
  }

  if (daysInactive <= 180) {
    return 10;
  }

  if (daysInactive <= 365) {
    return 20;
  }

  return 30;
}

export function calculateTrustScoreForPersistence(
  input: TrustScoreCalculationInput
): TrustScoreCalculationResult {
  const role = input.role ?? "platform";
  const verificationTier = normalizeTier(input.verificationTier);
  const tierCeiling = TIER_CEILINGS[verificationTier];

  const identity =
    input.identityVerified === true
      ? 100
      : (input.verificationCount ?? 0) > 0
        ? 50
        : 0;

  const transactions = clamp((input.transactionCount ?? 0) * 10);

  const positiveReviews = input.positiveReviewCount ?? 0;
  const negativeReviews = input.negativeReviewCount ?? 0;
  const totalReviews = positiveReviews + negativeReviews;

  const reviews =
    totalReviews > 0
      ? clamp((positiveReviews / totalReviews) * 100)
      : 0;

  const disputes = clamp(100 - (input.disputeCount ?? 0) * 25);
  const roleSpecific = transactions;

  const weightedScore =
    identity * 0.3 +
    transactions * 0.25 +
    reviews * 0.2 +
    disputes * 0.15 +
    roleSpecific * 0.1;

  const fraudPenalty =
    input.confirmedFraudFlag
      ? input.confirmedFraudSeverity === "high"
        ? 50
        : 25
      : 0;

  const inactivityPenalty = calculateInactivityPenalty(
    input.lastActivityAt
  );

  const rawScore = Math.round(
    clamp(weightedScore - fraudPenalty - inactivityPenalty)
  );

  const score = Math.min(rawScore, tierCeiling);
  const tier = getTrustScoreBand(score);
  const consumerTier = mapToConsumerTier(verificationTier, tier);

  return {
    subjectId: input.subjectId,
    role,
    score,
    tier,
    tierCeiling,
    confidence: calculateConfidence(input),
    factors: {
      identity: Math.round(identity),
      transactions: Math.round(transactions),
      reviews: Math.round(reviews),
      disputes: Math.round(disputes),
      roleSpecific: Math.round(roleSpecific)
    },
    verificationTier,
    consumerTier
  };
}

export type NextStep = {
  action: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  description?: string;
};

export type ComputeNextStepsInput = {
  verificationTier: VerificationTier;
  identityFactor: number;
  transactionCount: number;
  reviewCount: number;
  disputeCount: number;
  hasVerificationSessions: boolean;
  lastActivityAt?: Date | string | null;
};

export function computeNextSteps(input: ComputeNextStepsInput): NextStep[] {
  const steps: NextStep[] = [];

  if (input.disputeCount > 0) {
    steps.push({ action: "resolve_disputes", impact: "HIGH", description: "Resolve active disputes to improve trust score" });
  }

  if (input.verificationTier === "UNVERIFIED" && !input.hasVerificationSessions) {
    steps.push({ action: "complete_ghana_card_verification", impact: "HIGH", description: "Complete Ghana Card verification" });
  }

  if (input.identityFactor < 50) {
    steps.push({ action: "verify_identity", impact: "HIGH", description: "Verify your identity to build trust" });
  }

  if (input.transactionCount < 5) {
    steps.push({ action: "complete_transactions", impact: "MEDIUM", description: "Complete more transactions to build history" });
  }

  if (input.reviewCount === 0) {
    steps.push({ action: "request_review", impact: "MEDIUM", description: "Request reviews from transaction partners" });
  }

  if (input.lastActivityAt) {
    const activityDate = input.lastActivityAt instanceof Date ? input.lastActivityAt : new Date(input.lastActivityAt);
    const daysInactive = (Date.now() - activityDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysInactive > 90) {
      steps.push({ action: "increase_activity", impact: "MEDIUM", description: "Increase platform activity to maintain trust score" });
    }
  }

  const impactOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  steps.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

  return steps;
}
