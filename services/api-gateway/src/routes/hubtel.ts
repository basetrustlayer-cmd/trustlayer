import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  createHubtelCheckoutSession,
  handleHubtelWebhook
} from "../billing/providers/hubtel-provider.js";
import { verifyHubtelWebhookSignature } from "../billing/providers/hubtel-security.js";

const createCheckoutSchema = z.object({
  organizationId: z.string().min(1),
  planId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url()
});


type RawBodyRequest = FastifyRequest & {
  rawBody?: Buffer | string;
};

function getRawBody(request: RawBodyRequest): string {
  if (Buffer.isBuffer(request.rawBody)) {
    return request.rawBody.toString("utf8");
  }

  if (typeof request.rawBody === "string") {
    return request.rawBody;
  }

  return JSON.stringify(request.body ?? {});
}

function getHeader(request: FastifyRequest, name: string): string | undefined {
  const value = request.headers[name.toLowerCase()];

  return typeof value === "string" ? value : undefined;
}

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

  app.post(
    "/v1/billing/hubtel/webhook",
    {
      config: {
        rawBody: true
      }
    },
    async (request: RawBodyRequest, reply) => {
      try {
        verifyHubtelWebhookSignature({
          rawBody: getRawBody(request),
          signature: getHeader(request, "x-hubtel-signature"),
          timestamp: getHeader(request, "x-hubtel-timestamp")
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Invalid Hubtel webhook signature";

        return reply.status(401).send({
          error: message
        });
      }

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
    }
  );
}
