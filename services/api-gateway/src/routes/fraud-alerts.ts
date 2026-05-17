import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@trustlayer/database";

const listQuerySchema = z.object({
  status: z.string().optional(),
  severity: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

const idParamsSchema = z.object({
  id: z.string().min(1)
});

export async function registerFraudAlertRoutes(app: FastifyInstance): Promise<void> {
  app.get("/v1/fraud-alerts", async (request, reply) => {
    const query = listQuerySchema.parse(request.query);

    const alerts = await prisma.fraudAlert.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.severity ? { severity: query.severity } : {})
      },
      orderBy: {
        createdAt: "desc"
      },
      take: query.limit
    });

    return reply.status(200).send({
      count: alerts.length,
      alerts: alerts.map((alert) => ({
        id: alert.id,
        subjectId: alert.subjectId,
        severity: alert.severity,
        status: alert.status,
        reason: alert.reason,
        source: alert.source,
        metadata: alert.metadata,
        resolvedAt: alert.resolvedAt?.toISOString() ?? null,
        createdAt: alert.createdAt.toISOString(),
        updatedAt: alert.updatedAt.toISOString()
      }))
    });
  });

  app.get("/v1/fraud-alerts/:id", async (request, reply) => {
    const params = idParamsSchema.parse(request.params);

    const alert = await prisma.fraudAlert.findUnique({
      where: { id: params.id }
    });

    if (!alert) {
      return reply.status(404).send({
        error: "Fraud alert not found",
        id: params.id
      });
    }

    return reply.status(200).send({
      id: alert.id,
      subjectId: alert.subjectId,
      severity: alert.severity,
      status: alert.status,
      reason: alert.reason,
      source: alert.source,
      metadata: alert.metadata,
      resolvedAt: alert.resolvedAt?.toISOString() ?? null,
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString()
    });
  });

  app.post("/v1/fraud-alerts/:id/resolve", async (request, reply) => {
    const params = idParamsSchema.parse(request.params);

    const alert = await prisma.fraudAlert.update({
      where: { id: params.id },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date()
      }
    });

    return reply.status(200).send({
      id: alert.id,
      status: alert.status,
      resolvedAt: alert.resolvedAt?.toISOString() ?? null
    });
  });
}
