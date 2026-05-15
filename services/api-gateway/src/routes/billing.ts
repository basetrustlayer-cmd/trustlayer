import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  prisma,
  BillingInterval,
  PaymentProvider,
  SubscriptionStatus
} from "@trustlayer/database";

const createPlanSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().default("USD"),
  interval: z.nativeEnum(BillingInterval),
  trialDays: z.number().int().nonnegative().optional(),
  includesTrustScore: z.boolean().default(true),
  includesBadge: z.boolean().default(false),
  includesApiAccess: z.boolean().default(true)
});

const createSubscriptionSchema = z.object({
  organizationId: z.string().min(1),
  planId: z.string().min(1),
  provider: z.nativeEnum(PaymentProvider).default(PaymentProvider.STRIPE),
  trialDays: z.number().int().nonnegative().optional()
});

export async function registerBillingRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/billing/plans", async (request, reply) => {
    const parsed = createPlanSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid billing plan request",
        issues: parsed.error.flatten()
      });
    }

    const plan = await prisma.subscriptionPlan.create({
      data: parsed.data
    });

    return reply.status(201).send(plan);
  });

  app.get("/v1/billing/plans", async (_request, reply) => {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceCents: "asc" }
    });

    return reply.status(200).send({ plans });
  });

  app.post("/v1/billing/subscriptions", async (request, reply) => {
    const parsed = createSubscriptionSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid subscription request",
        issues: parsed.error.flatten()
      });
    }

    const data = parsed.data;
    const now = new Date();
    const trialDays = data.trialDays ?? 0;
    const trialEndsAt =
      trialDays > 0 ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : null;

    const subscription = await prisma.subscription.create({
      data: {
        organizationId: data.organizationId,
        planId: data.planId,
        provider: data.provider,
        status: trialDays > 0 ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
        trialEndsAt,
        currentPeriodStart: now
      },
      include: {
        plan: true
      }
    });

    return reply.status(201).send(subscription);
  });

  app.get("/v1/billing/subscriptions/:organizationId", async (request, reply) => {
    const params = z.object({ organizationId: z.string().min(1) }).parse(request.params);

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: params.organizationId },
      include: {
        plan: true,
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 10
        }
      }
    });

    if (!subscription) {
      return reply.status(404).send({
        error: "Subscription not found"
      });
    }

    return reply.status(200).send(subscription);
  });
}
