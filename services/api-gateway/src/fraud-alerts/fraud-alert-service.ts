import { prisma, Prisma } from "@trustlayer/database";

export type FraudAlertInput = {
  subjectId: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
  source?: string;
  metadata?: Record<string, unknown>;
};

export async function createFraudAlert(input: FraudAlertInput) {
  return prisma.fraudAlert.create({
    data: {
      subjectId: input.subjectId,
      severity: input.severity,
      reason: input.reason,
      source: input.source ?? "trust_score",
      metadata: input.metadata as Prisma.InputJsonValue | undefined
    }
  });
}

export async function createHighRiskTrustScoreAlert(input: {
  subjectId: string;
  score: number;
  role: string;
  reason?: string | null;
}) {
  if (input.score >= 50) {
    return null;
  }

  const existingOpenAlert = await prisma.fraudAlert.findFirst({
    where: {
      subjectId: input.subjectId,
      status: "OPEN",
      source: "trust_score"
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  if (existingOpenAlert) {
    return existingOpenAlert;
  }

  return createFraudAlert({
    subjectId: input.subjectId,
    severity: input.score < 30 ? "HIGH" : "MEDIUM",
    reason: "Low trust score requires fraud review",
    source: "trust_score",
    metadata: {
      score: input.score,
      role: input.role,
      reason: input.reason ?? "score.updated"
    }
  });
}
