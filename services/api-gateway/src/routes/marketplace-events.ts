import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@trustlayer/database";
import {
  recalculateTrustScoreFromMarketplace,
  type ScoreRole
} from "../scoring/scoring-service.js";

const scoreRoleSchema = z.enum(["seller", "buyer", "worker", "hirer", "platform"]);
const metadataSchema = z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]));

const transactionSchema = z.object({
  sellerSubjectId: z.string().min(1),
  buyerSubjectId: z.string().min(1),
  sellerRole: scoreRoleSchema.default("seller"),
  buyerRole: scoreRoleSchema.default("buyer"),
  amountCents: z.number().int().positive(),
  currency: z.string().min(3).max(3).default("GHS"),
  status: z.string().min(1).default("COMPLETED"),
  metadata: metadataSchema.optional()
});

const reviewSchema = z.object({
  reviewerSubjectId: z.string().min(1),
  revieweeSubjectId: z.string().min(1),
  reviewerRole: scoreRoleSchema,
  revieweeRole: scoreRoleSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  metadata: metadataSchema.optional()
});

const disputeSchema = z.object({
  filerSubjectId: z.string().min(1),
  respondentSubjectId: z.string().min(1),
  filerRole: scoreRoleSchema,
  respondentRole: scoreRoleSchema,
  status: z.string().min(1).default("OPEN"),
  faultParty: z.string().min(1).optional(),
  reason: z.string().max(2000).optional(),
  resolution: z.string().max(2000).optional(),
  metadata: metadataSchema.optional()
});

function toScoreRole(value: string): ScoreRole {
  if (
    value === "seller" ||
    value === "buyer" ||
    value === "worker" ||
    value === "hirer" ||
    value === "platform"
  ) {
    return value;
  }

  return "platform";
}

export async function registerMarketplaceEventRoutes(
  app: FastifyInstance
): Promise<void> {
  app.post("/v1/transactions", async (request, reply) => {
    const parsed = transactionSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid transaction event",
        issues: parsed.error.flatten()
      });
    }

    const data = parsed.data;

    const transaction = await prisma.transaction.create({
      data: {
        sellerSubjectId: data.sellerSubjectId,
        buyerSubjectId: data.buyerSubjectId,
        sellerRole: data.sellerRole,
        buyerRole: data.buyerRole,
        amountCents: data.amountCents,
        currency: data.currency,
        status: data.status,
        metadata: data.metadata ?? {}
      }
    });

    const sellerScore = await recalculateTrustScoreFromMarketplace(
      data.sellerSubjectId,
      toScoreRole(data.sellerRole),
      "transaction.created"
    );

    const buyerScore = await recalculateTrustScoreFromMarketplace(
      data.buyerSubjectId,
      toScoreRole(data.buyerRole),
      "transaction.created"
    );

    return reply.status(201).send({
      transaction,
      scores: {
        seller: sellerScore,
        buyer: buyerScore
      }
    });
  });

  app.post("/v1/reviews", async (request, reply) => {
    const parsed = reviewSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid review event",
        issues: parsed.error.flatten()
      });
    }

    const data = parsed.data;

    const review = await prisma.review.create({
      data: {
        reviewerSubjectId: data.reviewerSubjectId,
        revieweeSubjectId: data.revieweeSubjectId,
        reviewerRole: data.reviewerRole,
        revieweeRole: data.revieweeRole,
        rating: data.rating,
        comment: data.comment ?? null,
        metadata: data.metadata ?? {}
      }
    });

    const revieweeScore = await recalculateTrustScoreFromMarketplace(
      data.revieweeSubjectId,
      toScoreRole(data.revieweeRole),
      "review.created"
    );

    return reply.status(201).send({
      review,
      score: revieweeScore
    });
  });

  app.post("/v1/disputes", async (request, reply) => {
    const parsed = disputeSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid dispute event",
        issues: parsed.error.flatten()
      });
    }

    const data = parsed.data;

    const dispute = await prisma.dispute.create({
      data: {
        filerSubjectId: data.filerSubjectId,
        respondentSubjectId: data.respondentSubjectId,
        filerRole: data.filerRole,
        respondentRole: data.respondentRole,
        status: data.status,
        faultParty: data.faultParty ?? null,
        reason: data.reason ?? null,
        resolution: data.resolution ?? null,
        metadata: data.metadata ?? {}
      }
    });

    const filerScore = await recalculateTrustScoreFromMarketplace(
      data.filerSubjectId,
      toScoreRole(data.filerRole),
      "dispute.created"
    );

    const respondentScore = await recalculateTrustScoreFromMarketplace(
      data.respondentSubjectId,
      toScoreRole(data.respondentRole),
      "dispute.created"
    );

    return reply.status(201).send({
      dispute,
      scores: {
        filer: filerScore,
        respondent: respondentScore
      }
    });
  });
}
