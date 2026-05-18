import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createHubtelCheckoutSession,
  handleHubtelWebhook
} from "../billing/providers/hubtel-provider.js";

const createCheckoutSchema = z.object({
  organizationId: z.string().min(1),
  planId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url()
});

const webhookSchema = z.object({
  organizationId: z.string().min(1),
  planId: z.string().min(1),
  status: z.enum(["SUCCESS", "FAILED"]),
  customerReference: z.string().optional(),
  transactionId: z.string().optional()
});

export async function registerHubtelRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/billing/hubtel/checkout", async (request, reply) => {
    const parsed = createCheckoutSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid Hubtel checkout request",
        issues: parsed.error.flatten()
      });
    }

    try {
      const session = await createHubtelCheckoutSession(parsed.data);

      return reply.status(201).send(session);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Hubtel checkout failed";

      return reply.status(400).send({
        error: message
      });
    }
  });

  app.post("/v1/billing/hubtel/webhook", async (request, reply) => {
    const parsed = webhookSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid Hubtel webhook payload",
        issues: parsed.error.flatten()
      });
    }

    try {
      await handleHubtelWebhook(parsed.data);

      return reply.status(200).send({
        received: true
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Hubtel webhook failed";

      return reply.status(400).send({
        error: message
      });
    }
  });
}
