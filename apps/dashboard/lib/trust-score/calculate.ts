export type TrustScoreFactors = {
  identity: number;
  transactions: number;
  reviews: number;
  disputes: number;
  tenure: number;
};

type LegacyDocumentInput = {
  type: string;
  status: string;
  expiresAt?: string | Date | null;
};

export type TrustScoreInput = {
  identityVerified?: boolean;
  verificationCount?: number;
  transactionCount?: number;
  positiveReviewCount?: number;
  negativeReviewCount?: number;
  disputeCount?: number;
  confirmedFraudFlag?: boolean;
  platformCreatedAt?: Date | string | null;

  requiredDocuments?: string[];
  uploadedDocuments?: LegacyDocumentInput[];
  companyProfileComplete?: boolean;
};

export type TrustScoreResult = {
  score: number;
  tier: string;
  confidence: number;
  factors: TrustScoreFactors;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function calculateTenureScore(platformCreatedAt?: Date | string | null) {
  if (!platformCreatedAt) return 0;

  const created = new Date(platformCreatedAt).getTime();
  if (Number.isNaN(created)) return 0;

  const ageDays = Math.max(0, Math.floor((Date.now() - created) / 86_400_000));

  if (ageDays >= 365) return 100;
  if (ageDays >= 180) return 75;
  if (ageDays >= 90) return 50;
  if (ageDays >= 30) return 25;

  return 10;
}

function calculateConfidence(input: TrustScoreInput) {
  let confidence = 0.25;

  if (input.identityVerified) confidence += 0.3;
  if ((input.verificationCount ?? 0) > 0) confidence += 0.15;
  if ((input.transactionCount ?? 0) >= 5) confidence += 0.15;
  if ((input.positiveReviewCount ?? 0) + (input.negativeReviewCount ?? 0) >= 3) confidence += 0.1;
  if (input.platformCreatedAt) confidence += 0.05;

  return Number(clamp(confidence, 0.1, 0.95).toFixed(2));
}

export function getTrustScoreBand(score: number) {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good_standing";
  if (score >= 50) return "developing";
  if (score >= 30) return "limited";
  return "insufficient_data";
}

export function calculateTrustScoreDetailed(
  input: TrustScoreInput
): TrustScoreResult {
  const identity =
    input.identityVerified === true
      ? 100
      : (input.verificationCount ?? 0) > 0
        ? 50
        : input.companyProfileComplete
          ? 25
          : 0;

  const transactionCount = input.transactionCount ?? 0;
  const transactions = clamp(transactionCount * 10);

  const positiveReviews = input.positiveReviewCount ?? 0;
  const negativeReviews = input.negativeReviewCount ?? 0;
  const totalReviews = positiveReviews + negativeReviews;
  const reviews = totalReviews > 0 ? clamp((positiveReviews / totalReviews) * 100) : 0;

  const disputeCount = input.disputeCount ?? 0;
  const disputes = clamp(100 - disputeCount * 25);

  const tenure = calculateTenureScore(input.platformCreatedAt);

  const weightedScore =
    identity * 0.3 +
    transactions * 0.25 +
    reviews * 0.2 +
    disputes * 0.15 +
    tenure * 0.1;

  const fraudPenalty = input.confirmedFraudFlag ? 40 : 0;
  const score = Math.round(clamp(weightedScore - fraudPenalty));

  return {
    score,
    tier: getTrustScoreBand(score),
    confidence: calculateConfidence(input),
    factors: {
      identity: Math.round(identity),
      transactions: Math.round(transactions),
      reviews: Math.round(reviews),
      disputes: Math.round(disputes),
      tenure: Math.round(tenure)
    }
  };
}

/**
 * Legacy-compatible API: returns only the numeric score.
 */
export function calculateTrustScore(input: TrustScoreInput): number {
  return calculateTrustScoreDetailed(input).score;
}
