import { prisma } from "@trustlayer/database";
import { createFraudGraphServiceFromEnv } from "@trustlayer/fraud-graph";
import { publishTrustLayerEvent } from "../events/event-publisher.js";

export { calculateTrustScoreForPersistence } from "./scoring-calculator.js";
export type { ScoreRole, TrustScoreCalculationInput, TrustScoreCalculationResult } from "./scoring-calculator.js";
import { calculateTrustScoreForPersistence, type ScoreRole, type TrustScoreCalculationInput, type TrustScoreCalculationResult } from "./scoring-calculator.js";

async function getSubjectVerificationFacts(subjectId: string) {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: { verifications: true }
  });

  const verificationCount = subject?.verifications.length ?? 0;
  const identityVerified =
    subject?.verifications.some((verification) => verification.status === "VERIFIED") ??
    false;

  return {
    verificationTier: subject?.verificationTier ?? "UNVERIFIED",
    verificationCount,
    identityVerified
  };
}

async function getGraphRiskFacts(subjectId: string): Promise<Pick<TrustScoreCalculationInput, "confirmedFraudFlag" | "confirmedFraudSeverity">> {
  if (process.env.FRAUD_GRAPH_ENABLED !== "true") {
    return {};
  }

  const fraudGraph = createFraudGraphServiceFromEnv();

  try {
    const analytics = await fraudGraph.calculateRiskAnalytics(subjectId);

    if (analytics.riskLevel === "high") {
      return {
        confirmedFraudFlag: true,
        confirmedFraudSeverity: "high"
      };
    }

    return {};
  } catch {
    return {};
  } finally {
    await fraudGraph.close();
  }
}

async function getMarketplaceFacts(subjectId: string, role: ScoreRole) {
  const sellerTransactionCount = await prisma.transaction.count({
    where: { sellerSubjectId: subjectId }
  });

  const buyerTransactionCount = await prisma.transaction.count({
    where: { buyerSubjectId: subjectId }
  });

  const reviewStats = await prisma.review.groupBy({
    by: ["revieweeSubjectId"],
    where: { revieweeSubjectId: subjectId },
    _count: { id: true },
    _avg: { rating: true }
  });

  const avgRating = reviewStats[0]?._avg.rating ?? 0;
  const reviewCount = reviewStats[0]?._count.id ?? 0;

  const positiveReviewCount = Math.round((avgRating / 5) * reviewCount);
  const negativeReviewCount = Math.max(0, reviewCount - positiveReviewCount);

  const disputeCount = await prisma.dispute.count({
    where: {
      OR: [
        { filerSubjectId: subjectId },
        { respondentSubjectId: subjectId },
        { faultParty: subjectId }
      ]
    }
  });

  const transactionCount =
    role === "buyer" || role === "hirer"
      ? buyerTransactionCount
      : sellerTransactionCount;

  return {
    transactionCount,
    positiveReviewCount,
    negativeReviewCount,
    disputeCount
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

  await publishTrustLayerEvent("trustlayer.trust_scores", {
    id: trustScore.id,
    eventName: "trust_score.updated",
    subjectIds: [result.subjectId],
    occurredAt: new Date().toISOString(),
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

export async function recalculateTrustScoreFromMarketplace(
  subjectId: string,
  role: ScoreRole = "platform",
  reason = "marketplace.recalculated"
): Promise<TrustScoreCalculationResult> {
  const verificationFacts = await getSubjectVerificationFacts(subjectId);
  const marketplaceFacts = await getMarketplaceFacts(subjectId, role);
  const graphRiskFacts = await getGraphRiskFacts(subjectId);

  return upsertTrustScore({
    subjectId,
    role,
    ...verificationFacts,
    ...marketplaceFacts,
    ...graphRiskFacts,
    reason
  });
}
