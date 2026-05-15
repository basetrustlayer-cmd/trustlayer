import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";

function getScoreBand(score: number) {
  if (score >= 85) return "high_trust";
  if (score >= 70) return "good_standing";
  if (score >= 50) return "fair";
  if (score >= 30) return "low";
  return "unscored";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const platform = await prisma.platform.findUnique({
    where: { slug },
    include: {
      organization: true
    }
  });

  if (!platform?.organizationId || !platform.organization) {
    return NextResponse.json({ error: "Verification profile not found" }, { status: 404 });
  }

  const subject = await prisma.subject.findFirst({
    where: { externalId: platform.userId }
  });

  const score = subject
    ? await prisma.trustScore.findUnique({
        where: {
          subjectId_role: {
            subjectId: subject.id,
            role: "platform"
          }
        }
      })
    : null;

  const approvedVerification = await prisma.verificationRequest.findFirst({
    where: {
      organizationId: platform.organizationId,
      status: "APPROVED"
    },
    include: {
      documents: true
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  const approvedDocuments =
    approvedVerification?.documents.filter(
      (document) => document.reviewStatus === "APPROVED"
    ).length ?? 0;

  const totalDocuments = approvedVerification?.documents.length ?? 0;
  const currentScore = score?.score ?? 0;
  const verified = Boolean(approvedVerification) && currentScore >= 70;
  const issuedAt = approvedVerification?.updatedAt ?? null;
  const expiresAt = issuedAt
    ? new Date(issuedAt.getTime() + 365 * 24 * 60 * 60 * 1000)
    : null;

  const now = new Date();
  const expired = Boolean(expiresAt && expiresAt < now);
  const status = !verified ? "PENDING" : expired ? "EXPIRED" : "ACTIVE";

  return NextResponse.json({
    verified: verified && !expired,
    status,
    organizationName: platform.organization.name,
    platformName: platform.name,
    platformSlug: platform.slug,
    score: currentScore,
    band: getScoreBand(currentScore),
    confidence: score?.confidence ?? 0.1,
    verificationTier: subject?.verificationTier ?? "UNVERIFIED",
    certificateId: approvedVerification
      ? `TL-${issuedAt?.getFullYear() ?? now.getFullYear()}-${approvedVerification.id.slice(-8).toUpperCase()}`
      : null,
    approvedVerificationId: approvedVerification?.id ?? null,
    approvedDocuments,
    totalDocuments,
    issuedAt: issuedAt?.toISOString() ?? null,
    expiresAt: expiresAt?.toISOString() ?? null
  });
}
