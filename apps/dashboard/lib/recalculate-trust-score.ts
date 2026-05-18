import { prisma } from "./db";

export async function recalculateTrustScoreFromMarketplace(
  subjectId: string,
  role: "platform" | "seller" | "buyer" | "worker" | "hirer",
  reason: string
): Promise<void> {
  const existing = await prisma.trustScore.findUnique({
    where: {
      subjectId_role: {
        subjectId,
        role
      }
    }
  });

  const currentScore = existing?.score ?? 20;

  let nextScore = currentScore;

  if (reason === "business.verified") {
    nextScore = Math.max(currentScore, 75);
  } else if (reason === "business.verification_failed") {
    nextScore = Math.min(currentScore, 30);
  }

  await prisma.trustScore.upsert({
    where: {
      subjectId_role: {
        subjectId,
        role
      }
    },
    update: {
      score: nextScore,
      updatedAt: new Date()
    },
    create: {
      subjectId,
      role,
      score: nextScore
    }
  });
}
