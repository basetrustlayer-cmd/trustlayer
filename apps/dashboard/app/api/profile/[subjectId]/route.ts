import { NextResponse } from "next/server";
import { prisma } from "@trustlayer/database";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET(
  _req: Request,
  { params }: { params: { subjectId: string } }
) {
  const { subjectId } = params;

  const [subject, score, certifications] = await Promise.all([
    prisma.subject.findUnique({ where: { id: subjectId } }),
    prisma.trustScore.findFirst({
      where: { subjectId },
      orderBy: { calculatedAt: "desc" }
    }),
    prisma.certification.findMany({
      where: { subjectId, status: "ACTIVE" },
      orderBy: { issuedAt: "desc" },
      take: 5
    })
  ]);

  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  return NextResponse.json({
    subjectId: subject.id,
    displayName: subject.displayName ?? subject.id,
    verificationTier: subject.verificationTier,
    score: score
      ? {
          value: score.score,
          tier: score.tier,
          consumerTier: score.consumerTier,
          confidence: score.confidence,
          factors: score.factors,
          calculatedAt: score.calculatedAt
        }
      : null,
    certifications: certifications.map((c) => ({
      id: c.id,
      type: c.type,
      issuedAt: c.issuedAt,
      expiresAt: c.expiresAt
    }))
  });
}
