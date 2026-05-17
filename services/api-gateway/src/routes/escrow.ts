import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  cancelEscrow,
  createEscrowHold,
  releaseEscrow
} from "../escrow/escrow-service.js";

const createEscrowSchema = z.object({
  reference: z.string().min(1),
  buyerSubjectId: z.string().min(1),
  sellerSubjectId: z.string().min(1),
  amountCents: z.number().int().positive(),
  currency: z.string().min(3).max(3).default("GHS"),
  metadata: z.record(z.unknown()).optional()
});

const referenceParamsSchema = z.object({
  reference: z.string().min(1)
});

const releaseEscrowSchema = z.object({
  platformFeeCents: z.number().int().nonnegative().optional(),
  description: z.string().optional()
});

const cancelEscrowSchema = z.object({
  description: z.string().optional()
});

export async function registerEscrowRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/escrow/holds", async (request, reply) => {
    const parsed = createEscrowSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid escrow hold request",
        issues: parsed.error.flatten()
      });
    }

    try {
      const result = await createEscrowHold(parsed.data);
      return reply.status(201).send(result);
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "Escrow hold failed"
      });
    }
  });

  app.post("/v1/escrow/:reference/release", async (request, reply) => {
    const params = referenceParamsSchema.parse(request.params);
    const parsed = releaseEscrowSchema.safeParse(request.body ?? {});

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid escrow release request",
        issues: parsed.error.flatten()
      });
    }

    try {
      const result = await releaseEscrow({
        reference: params.reference,
        ...parsed.data
      });

      return reply.status(200).send(result);
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "Escrow release failed"
      });
    }
  });

  app.post("/v1/escrow/:reference/cancel", async (request, reply) => {
    const params = referenceParamsSchema.parse(request.params);
    const parsed = cancelEscrowSchema.safeParse(request.body ?? {});

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid escrow cancel request",
        issues: parsed.error.flatten()
      });
    }

    try {
      const result = await cancelEscrow({
        reference: params.reference,
        ...parsed.data
      });

      return reply.status(200).send(result);
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "Escrow cancel failed"
      });
    }
  });
}
