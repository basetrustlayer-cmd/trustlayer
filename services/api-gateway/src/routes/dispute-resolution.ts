import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  addDisputeEvidence,
  openDispute,
  resolveDispute
} from "../disputes/dispute-service.js";
import { prisma } from "@trustlayer/database";

const idParamsSchema = z.object({
  id: z.string().min(1)
});

const openDisputeSchema = z.object({
  filerSubjectId: z.string().min(1),
  respondentSubjectId: z.string().min(1),
  filerRole: z.enum(["BUYER", "SELLER"]),
  respondentRole: z.enum(["BUYER", "SELLER"]),
  reason: z.string().min(1),
  escrowReference: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).optional()
});

const evidenceSchema = z.object({
  submittedBySubjectId: z.string().min(1),
  evidenceType: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional()
});

const resolveSchema = z.object({
  resolution: z.enum(["RELEASE_TO_SELLER", "REFUND_BUYER", "NO_ESCROW_ACTION"]),
  faultParty: z.enum(["BUYER", "SELLER", "BOTH", "NONE"]).optional(),
  reason: z.string().optional(),
  platformFeeCents: z.number().int().nonnegative().optional()
});

export async function registerDisputeResolutionRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/dispute-resolution/disputes", async (request, reply) => {
    const parsed = openDisputeSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid dispute request",
        issues: parsed.error.flatten()
      });
    }

    try {
      const dispute = await openDispute(parsed.data);
      return reply.status(201).send(dispute);
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "Dispute creation failed"
      });
    }
  });

  app.get("/v1/dispute-resolution/disputes/:id", async (request, reply) => {
    const params = idParamsSchema.parse(request.params);
    const dispute = await prisma.dispute.findUnique({
      where: { id: params.id }
    });

    if (!dispute) {
      return reply.status(404).send({
        error: "Dispute not found",
        id: params.id
      });
    }

    return reply.status(200).send(dispute);
  });

  app.post("/v1/dispute-resolution/disputes/:id/evidence", async (request, reply) => {
    const params = idParamsSchema.parse(request.params);
    const parsed = evidenceSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid dispute evidence request",
        issues: parsed.error.flatten()
      });
    }

    try {
      const dispute = await addDisputeEvidence({
        disputeId: params.id,
        ...parsed.data
      });

      return reply.status(200).send(dispute);
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "Evidence submission failed"
      });
    }
  });

  app.post("/v1/dispute-resolution/disputes/:id/resolve", async (request, reply) => {
    const params = idParamsSchema.parse(request.params);
    const parsed = resolveSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid dispute resolution request",
        issues: parsed.error.flatten()
      });
    }

    try {
      const result = await resolveDispute({
        disputeId: params.id,
        ...parsed.data
      });

      return reply.status(200).send(result);
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "Dispute resolution failed"
      });
    }
  });
}
