import Fastify from "fastify";
import cors from "@fastify/cors";
import rawBody from "fastify-raw-body";
import { z } from "zod";
import { apiKeyAuthHook } from "./auth/api-key-auth.js";
import { registerApiKeyRoutes } from "./routes/api-keys.js";
import { registerBillingRoutes } from "./routes/billing.js";
import { registerStripeRoutes } from "./routes/stripe.js";
import { registerHubtelRoutes } from "./routes/hubtel.js";
import { registerMarketplaceEventRoutes } from "./routes/marketplace-events.js";
import { registerScoreHistoryRoutes } from "./routes/score-history.js";
import { registerLeaderboardRoutes } from "./routes/leaderboard.js";
import { registerEventMonitoringRoutes } from "./routes/events.js";
import { registerFraudGraphRoutes } from "./routes/fraud-graph.js";
import { createFraudGraphServiceFromEnv } from "@trustlayer/fraud-graph";
import { registerFraudAlertRoutes } from "./routes/fraud-alerts.js";
import { registerWalletRoutes } from "./routes/wallet.js";
import { registerEscrowRoutes } from "./routes/escrow.js";
import { registerDisputeResolutionRoutes } from "./routes/dispute-resolution.js";
import { registerNotificationRoutes } from "./routes/notifications.js";
import { hashPii } from "./security/pii.js";
import { upsertTrustScore, type ScoreRole } from "./scoring/scoring-service.js";
import { mapToConsumerTier, getProjectionTtl, computeNextSteps, type ConsumerTier } from "./scoring/scoring-calculator.js";
import { createDefaultKycOrchestrator } from "@trustlayer/kyc-orchestrator";
import { startTrustLayerEventConsumer } from "./events/event-consumer.js";
import { startWebhookRetryEngine } from "./webhooks/retry-engine.js";
import { registerObservabilityHooks } from "./observability/request-context.js";
import { renderPrometheusMetrics } from "./observability/metrics.js";
import {
  prisma,
  IdentityVerificationStatus,
  SubjectType,
  VerificationMethod
} from "@trustlayer/database";

const app = Fastify({ logger: true });
const kyc = createDefaultKycOrchestrator();

await app.register(cors, {
  origin: true
});

await app.register(rawBody, {
  field: "rawBody",
  global: false,
  encoding: false,
  runFirst: true
});

registerObservabilityHooks(app);

app.addHook("preHandler", apiKeyAuthHook);

await registerApiKeyRoutes(app);
await registerBillingRoutes(app);
await registerStripeRoutes(app);
await registerHubtelRoutes(app);
await registerMarketplaceEventRoutes(app);
await registerScoreHistoryRoutes(app);
await registerLeaderboardRoutes(app);
await registerEventMonitoringRoutes(app);
await registerFraudGraphRoutes(app);
await registerFraudAlertRoutes(app);
await registerWalletRoutes(app);
await registerEscrowRoutes(app);
await registerDisputeResolutionRoutes(app);
await registerNotificationRoutes(app);

const TIER_CEILINGS = {
  UNVERIFIED: 30,
  INDIVIDUAL: 65,
  BUSINESS: 85,
  ENHANCED: 100
} as const;

type VerificationTier = keyof typeof TIER_CEILINGS;

const scoreRoleSchema = z.enum(["seller", "buyer", "worker", "hirer", "platform"]);

const verifySchema = z.object({
  subjectId: z.string().min(1),
  method: z.nativeEnum(VerificationMethod),
  phone: z.string().optional(),
  nationalId: z.string().optional(),
  businessRegistrationNumber: z.string().optional(),
  country: z.string().min(2).max(2).default("GH")
});

function inferSubjectType(method: VerificationMethod): SubjectType {
  if (method === "BUSINESS_ORC") {
    return "BUSINESS";
  }

  return "INDIVIDUAL";
}

function inferTier(method: VerificationMethod): VerificationTier {
  if (method === "PHONE_OTP" || method === "GHANA_CARD") {
    return "INDIVIDUAL";
  }

  if (method === "BUSINESS_ORC") {
    return "BUSINESS";
  }

  if (method === "BVN" || method === "NIN") {
    return "ENHANCED";
  }

  return "UNVERIFIED";
}

function normalizeStoredTier(value: string): VerificationTier {
  if (
    value === "UNVERIFIED" ||
    value === "INDIVIDUAL" ||
    value === "BUSINESS" ||
    value === "ENHANCED"
  ) {
    return value;
  }

  return "UNVERIFIED";
}

function otpExpiry(): Date {
  return new Date(Date.now() + 10 * 60 * 1000);
}

app.get("/health", async () => {
  return {
    status: "ok",
    service: "trustlayer-api-gateway"
  };
});

app.get("/metrics", async (_request, reply) => {
  return reply
    .header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
    .send(renderPrometheusMetrics());
});

app.post("/v1/verify", async (request, reply) => {
  const parsed = verifySchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.status(400).send({
      error: "Invalid verification request",
      issues: parsed.error.flatten()
    });
  }

  const data = parsed.data;
  const subjectType = inferSubjectType(data.method);
  const requestedTier = inferTier(data.method);

  const kycResult = await kyc.verify({
    subjectId: data.subjectId,
    subjectType,
    method: data.method,
    country: data.country,
    nationalId: data.nationalId,
    phone: data.phone,
    businessRegistrationNumber: data.businessRegistrationNumber
  });

  const status =
    kycResult.status === "OTP_SENT"
      ? IdentityVerificationStatus.OTP_SENT
      : kycResult.verified
        ? IdentityVerificationStatus.VERIFIED
        : IdentityVerificationStatus.FAILED;

  const subject = await prisma.subject.upsert({
    where: {
      id: data.subjectId
    },
    create: {
      id: data.subjectId,
      type: subjectType,
      externalId: data.subjectId,
      country: data.country
    },
    update: {
      type: subjectType
    }
  });

  const tierBefore = normalizeStoredTier(subject.verificationTier);
  const tierAfter =
    status === IdentityVerificationStatus.VERIFIED ? requestedTier : tierBefore;

  const completedAt =
    status === IdentityVerificationStatus.VERIFIED ? new Date() : null;

  const verification = await prisma.verificationSession.create({
    data: {
      subjectId: subject.id,
      method: data.method,
      status,
      registryResponse: {
        provider: kycResult.provider,
        verified: kycResult.verified,
        confidence: kycResult.confidence,
        reference: kycResult.reference,
        method: data.method,
        phoneHash: hashPii(data.phone),
        nationalIdHash: hashPii(data.nationalId),
        businessRegistrationNumberHash: hashPii(data.businessRegistrationNumber)
      },
      tierBefore,
      tierAfter,
      expiresAt: status === IdentityVerificationStatus.OTP_SENT ? otpExpiry() : null,
      completedAt
    }
  });

  let verificationTier = tierBefore;

  if (status === IdentityVerificationStatus.VERIFIED) {
    const updatedSubject = await prisma.subject.update({
      where: {
        id: subject.id
      },
      data: {
        verificationTier: tierAfter,
        tierUpdatedAt: new Date()
      }
    });

    verificationTier = normalizeStoredTier(updatedSubject.verificationTier);
  }

  if (process.env.FRAUD_GRAPH_ENABLED === "true") {
    const fraudGraph = createFraudGraphServiceFromEnv();

    try {
      const phoneHash = hashPii(data.phone);
      const nationalIdHash = hashPii(data.nationalId);
      const businessRegistrationNumberHash = hashPii(
        data.businessRegistrationNumber
      );

      if (phoneHash) {
        await fraudGraph.upsertSubjectIdentifier({
          subjectId: subject.id,
          identifierType: "phone",
          identifierHash: phoneHash
        });
      }

      if (nationalIdHash) {
        await fraudGraph.upsertSubjectIdentifier({
          subjectId: subject.id,
          identifierType: "national_id",
          identifierHash: nationalIdHash
        });
      }

      if (businessRegistrationNumberHash) {
        await fraudGraph.upsertSubjectIdentifier({
          subjectId: subject.id,
          identifierType: "business_registration",
          identifierHash: businessRegistrationNumberHash
        });
      }
    } finally {
      await fraudGraph.close();
    }
  }

  const score = await upsertTrustScore({
    subjectId: subject.id,
    role: "platform",
    identityVerified: status === IdentityVerificationStatus.VERIFIED,
    verificationCount: 1,
    verificationTier,
    reason: "verification.completed"
  });

  return reply.status(200).send({
    verificationId: verification.id,
    status: verification.status,
    tierBefore,
    tier: verificationTier,
    tierAfter,
    consumerTier: score.consumerTier,
    expiresAt: verification.expiresAt?.toISOString() ?? null,
    score
  });
});

app.get("/v1/tier/:subjectId", async (request, reply) => {
  const params = z
    .object({
      subjectId: z.string().min(1)
    })
    .parse(request.params);

  const subject = await prisma.subject.findUnique({
    where: {
      id: params.subjectId
    }
  });

  if (!subject) {
    const consumerTier = mapToConsumerTier("UNVERIFIED", "unscored");
    return reply.status(200).send({
      subjectId: params.subjectId,
      tier: "UNVERIFIED",
      confidence: 0.1,
      tierCeiling: TIER_CEILINGS.UNVERIFIED,
      verificationTier: "UNVERIFIED",
      consumerTier,
      projectionTtlSeconds: getProjectionTtl("UNVERIFIED"),
      tierUpdatedAt: null
    });
  }

  const storedTier = normalizeStoredTier(subject.verificationTier);
  const tierCeiling = TIER_CEILINGS[storedTier];
  
  const trustScore = await prisma.trustScore.findUnique({
    where: {
      subjectId_role: {
        subjectId: subject.id,
        role: "platform"
      }
    }
  });

  let scoreBand = "unscored";
  if (trustScore) {
    if (trustScore.score >= 85) scoreBand = "high_trust";
    else if (trustScore.score >= 70) scoreBand = "good_standing";
    else if (trustScore.score >= 50) scoreBand = "fair";
    else if (trustScore.score >= 30) scoreBand = "low";
  }

  const consumerTier = mapToConsumerTier(storedTier, scoreBand);

  return reply.status(200).send({
    subjectId: subject.id,
    tier: storedTier,
    confidence: storedTier === "UNVERIFIED" ? 0.1 : 0.75,
    tierCeiling,
    verificationTier: storedTier,
    consumerTier,
    projectionTtlSeconds: getProjectionTtl(storedTier),
    tierUpdatedAt: subject.tierUpdatedAt?.toISOString() ?? null
  });
});

app.get("/v1/score/:subjectId", async (request, reply) => {
  const params = z
    .object({
      subjectId: z.string().min(1)
    })
    .parse(request.params);

  const query = z
    .object({
      role: scoreRoleSchema.optional()
    })
    .parse(request.query);

  const subject = await prisma.subject.findUnique({
    where: {
      id: params.subjectId
    }
  });

  const verificationTier = subject
    ? normalizeStoredTier(subject.verificationTier)
    : "UNVERIFIED";

  if (query.role) {
    const score = await prisma.trustScore.findUnique({
      where: {
        subjectId_role: {
          subjectId: params.subjectId,
          role: query.role
        }
      }
    });

    if (!score) {
      return reply.status(404).send({
        error: "TrustScore not found",
        subjectId: params.subjectId,
        role: query.role
      });
    }

    let scoreBand = "unscored";
    if (score.score >= 85) scoreBand = "high_trust";
    else if (score.score >= 70) scoreBand = "good_standing";
    else if (score.score >= 50) scoreBand = "fair";
    else if (score.score >= 30) scoreBand = "low";

    const consumerTier = mapToConsumerTier(verificationTier, scoreBand);

    // Check if subject has any verification sessions
    const verificationSessionCount = await prisma.verificationSession.count({
      where: {
        subjectId: params.subjectId
      }
    });

    // Calculate review count from factorReviews
    const reviewCount = score.factorReviews > 0 ? 1 : 0;

    const nextSteps = computeNextSteps({
      verificationTier,
      identityFactor: score.factorIdentity,
      transactionCount: Math.max(0, Math.round(score.factorTransactions / 10)),
      reviewCount,
      disputeCount: score.factorDisputes > 0 ? Math.round((100 - score.factorDisputes) / 25) : 0,
      hasVerificationSessions: verificationSessionCount > 0,
      lastActivityAt: subject?.updatedAt
    });

    return reply.status(200).send({
      subjectId: score.subjectId,
      role: score.role as ScoreRole,
      score: score.score,
      tierCeiling: score.tierCeiling,
      confidence: score.confidence,
      verificationTier,
      consumerTier,
      nextSteps,
      factors: {
        identity: score.factorIdentity,
        transactions: score.factorTransactions,
        reviews: score.factorReviews,
        disputes: score.factorDisputes,
        roleSpecific: score.factorRoleSpecific
      },
      createdAt: score.createdAt.toISOString(),
      updatedAt: score.updatedAt.toISOString()
    });
  }

  const scores = await prisma.trustScore.findMany({
    where: {
      subjectId: params.subjectId
    },
    orderBy: {
      role: "asc"
    }
  });

  if (scores.length === 0) {
    return reply.status(404).send({
      error: "TrustScore not found",
      subjectId: params.subjectId
    });
  }

  const composite = Math.round(
    scores.reduce((sum: number, item: any) => sum + item.score, 0) / scores.length
  );

  let compositeBand = "unscored";
  if (composite >= 85) compositeBand = "high_trust";
  else if (composite >= 70) compositeBand = "good_standing";
  else if (composite >= 50) compositeBand = "fair";
  else if (composite >= 30) compositeBand = "low";

  const compositeConsumerTier = mapToConsumerTier(verificationTier, compositeBand);

  // Aggregate factors for composite score
  const avgIdentityFactor = Math.round(
    scores.reduce((sum: number, item: any) => sum + item.factorIdentity, 0) / scores.length
  );
  const avgTransactionCount = Math.max(
    0,
    Math.round(
      scores.reduce((sum: number, item: any) => sum + item.factorTransactions, 0) / scores.length / 10
    )
  );
  const reviewCount = scores.some((s: any) => s.factorReviews > 0) ? 1 : 0;
  const avgDisputeFactor = scores.reduce((sum: number, item: any) => sum + item.factorDisputes, 0) / scores.length;
  const disputeCount = avgDisputeFactor > 0 ? Math.round((100 - avgDisputeFactor) / 25) : 0;

  // Check if subject has any verification sessions
  const verificationSessionCount = await prisma.verificationSession.count({
    where: {
      subjectId: params.subjectId
    }
  });

  const nextSteps = computeNextSteps({
    verificationTier,
    identityFactor: avgIdentityFactor,
    transactionCount: avgTransactionCount,
    reviewCount,
    disputeCount,
    hasVerificationSessions: verificationSessionCount > 0,
    lastActivityAt: subject?.updatedAt
  });

  const scoresByRole = Object.fromEntries(
    scores.map((score: any) => {
      let scoreBand = "unscored";
      if (score.score >= 85) scoreBand = "high_trust";
      else if (score.score >= 70) scoreBand = "good_standing";
      else if (score.score >= 50) scoreBand = "fair";
      else if (score.score >= 30) scoreBand = "low";

      const consumerTier = mapToConsumerTier(verificationTier, scoreBand);

      return [
        score.role,
        {
          score: score.score,
          tierCeiling: score.tierCeiling,
          confidence: score.confidence,
          consumerTier,
          updatedAt: score.updatedAt.toISOString()
        }
      ];
    })
  );

  return reply.status(200).send({
    subjectId: params.subjectId,
    verificationTier,
    consumerTier: compositeConsumerTier,
    composite,
    nextSteps,
    scores: scoresByRole
  });
});

const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || "0.0.0.0";

if (process.env.EVENT_CONSUMER_ENABLED === "true") {
  startTrustLayerEventConsumer().catch((error: unknown) => {
    app.log.error({ error }, "TrustLayer event consumer failed to start");
  });
}

startWebhookRetryEngine();

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

export { WebhookDeliveryService } from "./webhooks/webhook-delivery.js";

const confirmOtpSchema = z.object({
  subjectId: z.string().min(1),
  verificationSessionId: z.string().min(1),
  otpCode: z.string().min(4).max(8)
});

app.post("/v1/verify/confirm", async (request, reply) => {
  const parsed = confirmOtpSchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.status(400).send({
      error: "Invalid OTP confirmation request",
      issues: parsed.error.flatten()
    });
  }

  const { subjectId, verificationSessionId } = parsed.data;

  const session = await prisma.verificationSession.findUnique({
    where: { id: verificationSessionId }
  });

  if (!session) {
    return reply.status(404).send({ error: "Verification session not found" });
  }

  if (session.subjectId !== subjectId) {
    return reply.status(403).send({ error: "Session does not belong to this subject" });
  }

  if (session.status !== IdentityVerificationStatus.OTP_SENT) {
    return reply.status(400).send({
      error: "Session is not awaiting OTP confirmation",
      status: session.status
    });
  }

  if (session.expiresAt && session.expiresAt < new Date()) {
    await prisma.verificationSession.update({
      where: { id: session.id },
      data: { status: IdentityVerificationStatus.EXPIRED }
    });
    return reply.status(400).send({ error: "OTP session has expired" });
  }

  await prisma.verificationSession.update({
    where: { id: session.id },
    data: {
      status: IdentityVerificationStatus.VERIFIED,
      completedAt: new Date()
    }
  });

  const updatedSubject = await prisma.subject.update({
    where: { id: subjectId },
    data: {
      verificationTier: "INDIVIDUAL",
      tierUpdatedAt: new Date()
    }
  });

  const verificationTier = normalizeStoredTier(updatedSubject.verificationTier);

  const score = await upsertTrustScore({
    subjectId,
    role: "platform",
    identityVerified: true,
    verificationCount: 1,
    verificationTier,
    reason: "otp.confirmed"
  });

  return reply.status(200).send({
    verificationSessionId: session.id,
    status: "VERIFIED",
    tier: verificationTier,
    consumerTier: mapToConsumerTier(verificationTier, score.tier),
    score
  });
});
