import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  constructStripeWebhookEvent,
  createStripeCheckoutSession,
  handleStripeWebhookEvent
} from "../billing/providers/stripe-provider.js";
import Stripe from "stripe";
import { prisma, PaymentProvider } from "@trustlayer/database";

const createCheckoutSchema = z.object({
  organizationId: z.string().min(1),
  planId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url()
});

const createPortalSchema = z.object({
  organizationId: z.string().min(1),
  returnUrl: z.string().url()
});

type StripeWebhookRequest = FastifyRequest & {
  rawBody?: Buffer | string;
};

function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is required.");
  }

  return new Stripe(secretKey);
}

function getWebhookRawBody(request: StripeWebhookRequest): Buffer {
  if (Buffer.isBuffer(request.rawBody)) {
    return request.rawBody;
  }

  if (typeof request.rawBody === "string") {
    return Buffer.from(request.rawBody, "utf8");
  }

  if (Buffer.isBuffer(request.body)) {
    return request.body;
  }

  throw new Error(
    "Stripe webhook raw body is unavailable. Register @fastify/raw-body before Stripe routes."
  );
}

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
      const message =
        error instanceof Error ? error.message : "Stripe checkout failed";

      return reply.status(400).send({
        error: message
      });
    }
  });

  app.post(
    "/v1/billing/stripe/webhook",
    {
      config: {
        rawBody: true
      }
    },
    async (request: StripeWebhookRequest, reply) => {
      const signature = request.headers["stripe-signature"];

      if (typeof signature !== "string") {
        return reply.status(400).send({
          error: "Missing Stripe signature"
        });
      }

      try {
        const rawBody = getWebhookRawBody(request);
        const event = constructStripeWebhookEvent(rawBody, signature);

        await handleStripeWebhookEvent(event);

        return reply.status(200).send({
          received: true
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Stripe webhook failed";

        return reply.status(400).send({
          error: message
        });
      }
    }
  );

  app.post("/v1/billing/stripe/portal", async (request, reply) => {
    const parsed = createPortalSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid billing portal request",
        issues: parsed.error.flatten()
      });
    }

    const subscription = await prisma.subscription.findUnique({
      where: {
        organizationId: parsed.data.organizationId
      }
    });

    if (
      !subscription ||
      subscription.provider !== PaymentProvider.STRIPE ||
      !subscription.externalCustomerId
    ) {
      return reply.status(404).send({
        error: "Stripe customer not found for organization"
      });
    }

    try {
      const stripe = getStripe();

      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.externalCustomerId,
        return_url: parsed.data.returnUrl
      });

      return reply.status(201).send({
        portalUrl: session.url
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Stripe portal failed";

      return reply.status(400).send({
        error: message
      });
    }
  });
}
