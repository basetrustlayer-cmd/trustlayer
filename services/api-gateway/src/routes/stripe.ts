import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createStripeCheckoutSession } from "../billing/providers/stripe-provider.js";

const createCheckoutSchema = z.object({
  organizationId: z.string().min(1),
  planId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url()
});

export async function registerStripeRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/billing/stripe/checkout", async (request, reply) => {
    const parsed = createCheckoutSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid Stripe checkout request",
        issues: parsed.error.flatten()
      });
    }

    try {
      const session = await createStripeCheckoutSession(parsed.data);

      return reply.status(201).send(session);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Stripe checkout failed";

      return reply.status(400).send({
        error: message
      });
    }
  });
}
