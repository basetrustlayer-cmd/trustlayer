import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { getSessionUser } from "../../../lib/session";
import { calculateTrustScoreDetailed } from "../../../lib/trust-score/calculate";
import { assertTrustScoreAccessAllowed } from "../../../lib/billing/limits";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const platform = await prisma.platform.findFirst({
    where: {
      userId: user.id
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  if (!platform?.organizationId) {
    return NextResponse.json(
      {
        error: "No organization is linked to this platform."
      },
      { status: 403 }
    );
  }

  const access = await assertTrustScoreAccessAllowed(
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
    where: {
      externalId: user.id
    },
    include: {
      verifications: true
    }
  });

  const verificationCount = subject?.verifications.length ?? 0;
  const identityVerified =
    subject?.verifications.some(
      (verification) => verification.status === "VERIFIED"
    ) ?? false;

  const result = calculateTrustScoreDetailed({
    identityVerified,
    verificationCount,
    transactionCount: 0,
    positiveReviewCount: 0,
    negativeReviewCount: 0,
    disputeCount: 0,
    confirmedFraudFlag: false,
    platformCreatedAt: platform.createdAt
  });

  return NextResponse.json({
    ...result,
    subjectId: subject?.id ?? null,
    source: "identity_first"
  });
}
