import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { getSessionUser } from "../../../lib/session";
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

  const access = await assertTrustScoreAccessAllowed(platform.organizationId);

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
    }
  });

  if (!subject) {
    return NextResponse.json({
      subjectId: null,
      score: 0,
      role: "platform",
      tier: "unscored",
      tierCeiling: 30,
      confidence: 0.1,
      verificationTier: "UNVERIFIED",
      factors: {
        identity: 0,
        transactions: 0,
        reviews: 0,
        disputes: 0,
        roleSpecific: 0
      },
      history: [],
      leaderboard: [],
      source: "persisted_trust_score"
    });
  }

  const score = await prisma.trustScore.findUnique({
    where: {
      subjectId_role: {
        subjectId: subject.id,
        role: "platform"
      }
    }
  });

  const history = await prisma.scoreHistory.findMany({
    where: {
      subjectId: subject.id,
      role: "platform"
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 10
  });

  const leaderboard = await prisma.trustScore.findMany({
    where: {
      role: "platform"
    },
    orderBy: [
      {
        score: "desc"
      },
      {
        confidence: "desc"
      },
      {
        updatedAt: "desc"
      }
    ],
    take: 10,
    include: {
      subject: true
    }
  });

  const rank =
    score
      ? leaderboard.findIndex((entry) => entry.subjectId === score.subjectId) + 1
      : null;

  return NextResponse.json({
    subjectId: subject.id,
    role: "platform",
    score: score?.score ?? 0,
    tier: score
      ? score.score >= 85
        ? "high_trust"
        : score.score >= 70
          ? "good_standing"
          : score.score >= 50
            ? "fair"
            : score.score >= 30
              ? "low"
              : "unscored"
      : "unscored",
    tierCeiling: score?.tierCeiling ?? 30,
    confidence: score?.confidence ?? 0.1,
    verificationTier: subject.verificationTier,
    rank: rank && rank > 0 ? rank : null,
    factors: {
      identity: score?.factorIdentity ?? 0,
      transactions: score?.factorTransactions ?? 0,
      reviews: score?.factorReviews ?? 0,
      disputes: score?.factorDisputes ?? 0,
      roleSpecific: score?.factorRoleSpecific ?? 0
    },
    history: history.map((entry) => ({
      id: entry.id,
      score: entry.score,
      confidence: entry.confidence,
      tierCeiling: entry.tierCeiling,
      reason: entry.reason,
      createdAt: entry.createdAt.toISOString()
    })),
    leaderboard: leaderboard.map((entry, index) => ({
      rank: index + 1,
      subjectId: entry.subjectId,
      externalId: entry.subject.externalId,
      subjectType: entry.subject.type,
      verificationTier: entry.subject.verificationTier,
      score: entry.score,
      confidence: entry.confidence,
      updatedAt: entry.updatedAt.toISOString()
    })),
    source: "persisted_trust_score"
  });
}
