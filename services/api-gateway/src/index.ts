import Fastify from "fastify";
import cors from "@fastify/cors";
import { z } from "zod";
import { apiKeyAuthHook } from "./auth/api-key-auth.js";
import { registerApiKeyRoutes } from "./routes/api-keys.js";
import { registerBillingRoutes } from "./routes/billing.js";
import { registerStripeRoutes } from "./routes/stripe.js";
import { hashPii } from "./security/pii.js";
import { upsertTrustScore, type ScoreRole } from "./scoring/scoring-service.js";
import {
  prisma,
  IdentityVerificationStatus,
  SubjectType,
  VerificationMethod
} from "@trustlayer/database";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true
});

app.addHook("preHandler", apiKeyAuthHook);

await registerApiKeyRoutes(app);
await registerBillingRoutes(app);
await registerStripeRoutes(app);

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
  nationalId: z.string().optional()
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

app.get("/health", async () => {
  return {
    status: "ok",
    service: "trustlayer-api-gateway"
  };
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
  const tier = inferTier(data.method);

  const status =
    data.method === "PHONE_OTP"
      ? IdentityVerificationStatus.OTP_SENT
      : IdentityVerificationStatus.VERIFIED;

  const subject = await prisma.subject.upsert({
    where: {
      id: data.subjectId
    },
    create: {
      id: data.subjectId,
      type: subjectType,
      externalId: data.subjectId,
      country: "GH"
    },
    update: {
      type: subjectType
    }
  });

  const completedAt =
    status === IdentityVerificationStatus.VERIFIED ? new Date() : null;

  const verification = await prisma.verificationSession.create({
    data: {
      subjectId: subject.id,
      method: data.method,
      status,
      registryResponse: {
        provider: "mock",
        verified: status === IdentityVerificationStatus.VERIFIED,
        method: data.method,
        phoneHash: hashPii(data.phone),
        nationalIdHash: hashPii(data.nationalId)
      },
      completedAt
    }
  });

  let verificationTier = normalizeStoredTier(subject.verificationTier);

  if (status === IdentityVerificationStatus.VERIFIED) {
    const updatedSubject = await prisma.subject.update({
      where: {
        id: subject.id
      },
      data: {
        verificationTier: tier,
        tierUpdatedAt: new Date()
      }
    });

    verificationTier = normalizeStoredTier(updatedSubject.verificationTier);
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
    tier: verificationTier,
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
    return reply.status(200).send({
      subjectId: params.subjectId,
      tier: "UNVERIFIED",
      confidence: 0.1,
      tierCeiling: TIER_CEILINGS.UNVERIFIED,
      tierUpdatedAt: null
    });
  }

  const storedTier = normalizeStoredTier(subject.verificationTier);

  return reply.status(200).send({
    subjectId: subject.id,
    tier: storedTier,
    confidence: storedTier === "UNVERIFIED" ? 0.1 : 0.75,
    tierCeiling: TIER_CEILINGS[storedTier],
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
      role: scoreRoleSchema.default("platform")
    })
    .parse(request.query);

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

  return reply.status(200).send({
    subjectId: score.subjectId,
    role: score.role as ScoreRole,
    score: score.score,
    tierCeiling: score.tierCeiling,
    confidence: score.confidence,
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
});

const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || "0.0.0.0";

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

export { WebhookDeliveryService } from "./webhooks/webhook-delivery.js";
