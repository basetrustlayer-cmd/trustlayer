import { prisma } from "@trustlayer/database";

const TIER_CEILINGS = {
  UNVERIFIED: 30,
  INDIVIDUAL: 65,
  BUSINESS: 85,
  ENHANCED: 100
} as const;

type VerificationTier = keyof typeof TIER_CEILINGS;

export type ScoreRole = "seller" | "buyer" | "worker" | "hirer" | "platform";

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
  verificationTier?: string | null;
  reason?: string;
};

export type TrustScoreCalculationResult = {
  subjectId: string;
  role: ScoreRole;
  score: number;
  tier: string;
  tierCeiling: number;
  confidence: number;
  factors: TrustScoreFactors;
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

function calculateConfidence(input: TrustScoreCalculationInput): number {
  let confidence = 0.25;

  if (input.identityVerified) confidence += 0.3;
  if ((input.verificationCount ?? 0) > 0) confidence += 0.15;
  if ((input.transactionCount ?? 0) >= 5) confidence += 0.15;

  const reviewCount =
    (input.positiveReviewCount ?? 0) + (input.negativeReviewCount ?? 0);

  if (reviewCount >= 3) confidence += 0.1;

  return Number(clamp(confidence, 0.1, 0.95).toFixed(2));
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
    totalReviews > 0 ? clamp((positiveReviews / totalReviews) * 100) : 0;

  const disputes = clamp(100 - (input.disputeCount ?? 0) * 25);
  const roleSpecific = transactions;

  const weightedScore =
    identity * 0.3 +
    transactions * 0.25 +
    reviews * 0.2 +
    disputes * 0.15 +
    roleSpecific * 0.1;

  const fraudPenalty = input.confirmedFraudFlag ? 40 : 0;
  const rawScore = Math.round(clamp(weightedScore - fraudPenalty));
  const score = Math.min(rawScore, tierCeiling);

  return {
    subjectId: input.subjectId,
    role,
    score,
    tier: getTrustScoreBand(score),
    tierCeiling,
    confidence: calculateConfidence(input),
    factors: {
      identity: Math.round(identity),
      transactions: Math.round(transactions),
      reviews: Math.round(reviews),
      disputes: Math.round(disputes),
      roleSpecific: Math.round(roleSpecific)
    }
  };
}

export async function upsertTrustScore(
  input: TrustScoreCalculationInput
): Promise<TrustScoreCalculationResult> {
  const result = calculateTrustScoreForPersistence(input);

  const trustScore = await prisma.trustScore.upsert({
    where: {
      subjectId_role: {
        subjectId: result.subjectId,
        role: result.role
      }
    },
    create: {
      subjectId: result.subjectId,
      role: result.role,
      score: result.score,
      tierCeiling: result.tierCeiling,
      confidence: result.confidence,
      factorIdentity: result.factors.identity,
      factorTransactions: result.factors.transactions,
      factorReviews: result.factors.reviews,
      factorDisputes: result.factors.disputes,
      factorRoleSpecific: result.factors.roleSpecific
    },
    update: {
      score: result.score,
      tierCeiling: result.tierCeiling,
      confidence: result.confidence,
      factorIdentity: result.factors.identity,
      factorTransactions: result.factors.transactions,
      factorReviews: result.factors.reviews,
      factorDisputes: result.factors.disputes,
      factorRoleSpecific: result.factors.roleSpecific
    }
  });

  await prisma.scoreHistory.create({
    data: {
      trustScoreId: trustScore.id,
      subjectId: result.subjectId,
      role: result.role,
      score: result.score,
      tierCeiling: result.tierCeiling,
      confidence: result.confidence,
      factors: result.factors,
      reason: input.reason ?? "score.updated"
    }
  });

  return result;
}
