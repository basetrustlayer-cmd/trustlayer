import Fastify from "fastify";
import cors from "@fastify/cors";
import { z } from "zod";
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

const TIER_CEILINGS = {
  UNVERIFIED: 30,
  INDIVIDUAL: 65,
  BUSINESS: 85,
  ENHANCED: 100
} as const;

type VerificationTier = keyof typeof TIER_CEILINGS;

const verifySchema = z.object({
  subjectId: z.string().min(1),
  method: z.nativeEnum(VerificationMethod),
  phone: z.string().optional(),
  nationalId: z.string().optional()
});

function inferSubjectType(method: VerificationMethod): SubjectType {
  if (method === "BUSINESS_ORC") return "BUSINESS";
  return "INDIVIDUAL";
}

function inferTier(method: VerificationMethod): VerificationTier {
  if (method === "PHONE_OTP") return "INDIVIDUAL";
  if (method === "BUSINESS_ORC") return "BUSINESS";
  if (method === "GHANA_CARD" || method === "BVN" || method === "NIN") {
    return "ENHANCED";
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

  const verification = await prisma.verificationSession.create({
    data: {
      subjectId: subject.id,
      method: data.method,
      status:
        data.method === "PHONE_OTP"
          ? IdentityVerificationStatus.OTP_SENT
          : IdentityVerificationStatus.VERIFIED,
      registryResponse: {
        provider: "mock",
        verified: data.method !== "PHONE_OTP",
        method: data.method
      },
      completedAt: data.method === "PHONE_OTP" ? null : new Date()
    }
  });

  return reply.status(200).send({
    verificationId: verification.id,
    status: verification.status,
    tier
  });
});

app.get("/v1/tier/:subjectId", async (request, reply) => {
  const params = z.object({ subjectId: z.string().min(1) }).parse(request.params);

  const subject = await prisma.subject.findUnique({
    where: {
      id: params.subjectId
    },
    include: {
      verifications: {
        orderBy: {
          createdAt: "desc"
        }
      }
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

  const verifiedMethods = subject.verifications
    .filter((verification) => verification.status === "VERIFIED")
    .map((verification) => verification.method);

  let tier: VerificationTier = "UNVERIFIED";

  if (
    verifiedMethods.includes("GHANA_CARD") ||
    verifiedMethods.includes("BVN") ||
    verifiedMethods.includes("NIN")
  ) {
    tier = "ENHANCED";
  } else if (verifiedMethods.includes("BUSINESS_ORC")) {
    tier = "BUSINESS";
  } else if (
    verifiedMethods.includes("PHONE_OTP") ||
    subject.verifications.some((verification) => verification.status === "OTP_SENT")
  ) {
    tier = "INDIVIDUAL";
  }

  return reply.status(200).send({
    subjectId: subject.id,
    tier,
    confidence: tier === "UNVERIFIED" ? 0.1 : 0.75,
    tierCeiling: TIER_CEILINGS[tier],
    tierUpdatedAt: subject.updatedAt.toISOString()
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
