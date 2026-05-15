import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getSessionUser } from "../../../../lib/session";
import { calculateTrustScoreDetailed } from "../../../../lib/trust-score/calculate";
import { assertBadgeAccessAllowed } from "../../../../lib/billing/limits";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const platform = await prisma.platform.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" }
  });

  if (!platform?.organizationId) {
    return NextResponse.json(
      {
        error: "No organization is linked to this platform."
      },
      { status: 403 }
    );
  }

  const access = await assertBadgeAccessAllowed(
    platform.organizationId
  );

  if (!access.allowed) {
    return NextResponse.json(
      {
        error: access.reason
      },
      { status: 403 }
    );
  }

  const subject = await prisma.subject.findFirst({
    where: { externalId: user.id },
    include: { verifications: true }
  });

  const identityVerified =
    subject?.verifications.some(
      (verification) => verification.status === "VERIFIED"
    ) ?? false;

  const result = calculateTrustScoreDetailed({
    identityVerified,
    verificationCount: subject?.verifications.length ?? 0,
    platformCreatedAt: platform.createdAt
  });

  const eligible = identityVerified && result.score >= 70;

  return NextResponse.json({
    eligible,
    score: result.score,
    tier: result.tier,
    confidence: result.confidence,
    badgeLabel: eligible ? "TrustLayer Verified" : "TrustLayer Pending",
    platformName: platform.name,
    issuedAt: eligible ? new Date().toISOString() : null
  });
}
