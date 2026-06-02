import { NextResponse } from "next/server";
import { prisma } from "@trustlayer/database";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET(
  _req: Request,
  context: { params: Promise<{ subjectId: string }> }
) {
  const { subjectId } = await context.params;

  const [subject, score] = await Promise.all([
    prisma.subject.findUnique({ where: { id: subjectId } }),
    prisma.trustScore.findFirst({
      where: { subjectId },
      orderBy: { updatedAt: "desc" }
    })
  ]);

  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  return NextResponse.json({
    subjectId: subject.id,
    displayName: subject.externalId ?? subject.id,
    verificationTier: subject.verificationTier,
    score: score
      ? {
          value: score.score,
          tier: String(score.tierCeiling),
          consumerTier: String(score.tierCeiling),
          confidence: score.confidence,
          factors: {
            identity: score.factorIdentity,
            transactions: score.factorTransactions,
            reviews: score.factorReviews,
            disputes: score.factorDisputes,
            roleSpecific: score.factorRoleSpecific
          },
          calculatedAt: score.updatedAt
        }
      : null,
    certifications: []
  });
}
