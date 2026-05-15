import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getSessionUser } from "../../../../lib/session";
import { assertBadgeAccessAllowed } from "../../../../lib/billing/limits";
import { getCredentialLifecycle } from "../../../../lib/certification/lifecycle";

function getScoreBand(score: number) {
  if (score >= 85) return "high_trust";
  if (score >= 70) return "good_standing";
  if (score >= 50) return "fair";
  if (score >= 30) return "low";
  return "unscored";
}

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const platform = await prisma.platform.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { organization: true }
  });

  if (!platform?.organizationId || !platform.organization) {
    return NextResponse.json(
      { error: "No organization is linked to this platform." },
      { status: 403 }
    );
  }

  const access = await assertBadgeAccessAllowed(platform.organizationId);

  if (!access.allowed) {
    return NextResponse.json({ error: access.reason }, { status: 403 });
  }

  const subject = await prisma.subject.findFirst({
    where: { externalId: user.id }
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
  const lifecycle = getCredentialLifecycle({
    hasApprovedVerification: Boolean(approvedVerification),
    approvedVerificationUpdatedAt: approvedVerification?.updatedAt ?? null,
    score: currentScore
  });

  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/verify/${platform.slug}`;

  return NextResponse.json({
    eligible: lifecycle.eligible,
    verified: lifecycle.verified,
    status: lifecycle.status,
    organizationName: platform.organization.name,
    platformName: platform.name,
    platformSlug: platform.slug,
    score: currentScore,
    band: getScoreBand(currentScore),
    confidence: score?.confidence ?? 0.1,
    verificationTier: subject?.verificationTier ?? "UNVERIFIED",
    approvedVerification: Boolean(approvedVerification),
    approvedVerificationId: approvedVerification?.id ?? null,
    approvedDocuments,
    totalDocuments,
    badgeLabel: lifecycle.verified ? "TrustLayer Verified" : lifecycle.status === "EXPIRED" ? "TrustLayer Expired" : "TrustLayer Pending",
    issuedAt: lifecycle.issuedAt?.toISOString() ?? null,
    expiresAt: lifecycle.expiresAt?.toISOString() ?? null,
    renewalDueAt: lifecycle.renewalDueAt?.toISOString() ?? null,
    daysUntilExpiration: lifecycle.daysUntilExpiration,
    verificationUrl,
    embedCode: `<a href="${verificationUrl}" target="_blank" rel="noreferrer">TrustLayer Verified</a>`
  });
}
