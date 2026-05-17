import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@trustlayer/database";
import { recalculateTrustScoreFromMarketplace, type ScoreRole } from "../scoring/scoring-service.js";

function toScoreRole(value: unknown): ScoreRole {
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

export async function registerEventMonitoringRoutes(
  app: FastifyInstance
): Promise<void> {
  app.get("/v1/events", async (request, reply) => {
    const query = z
      .object({
        status: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(50)
      })
      .parse(request.query);

    const events = await prisma.eventLog.findMany({
      where: query.status
        ? {
            status: query.status
          }
        : undefined,
      orderBy: {
        createdAt: "desc"
      },
      take: query.limit
    });

    return reply.status(200).send({
      count: events.length,
      events: events.map((event) => ({
        eventId: event.eventId,
        topic: event.topic,
        eventName: event.eventName,
        status: event.status,
        processedAt: event.processedAt?.toISOString() ?? null,
        errorMessage: event.errorMessage,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString()
      }))
    });
  });

  app.get("/v1/events/:eventId", async (request, reply) => {
    const params = z
      .object({
        eventId: z.string().min(1)
      })
      .parse(request.params);

    const event = await prisma.eventLog.findUnique({
      where: {
        eventId: params.eventId
      }
    });

    if (!event) {
      return reply.status(404).send({
        error: "Event not found",
        eventId: params.eventId
      });
    }

    return reply.status(200).send({
      eventId: event.eventId,
      topic: event.topic,
      eventName: event.eventName,
      payload: event.payload,
      status: event.status,
      processedAt: event.processedAt?.toISOString() ?? null,
      errorMessage: event.errorMessage,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString()
    });
  });

  app.post("/v1/events/:eventId/reprocess", async (request, reply) => {
    const params = z
      .object({
        eventId: z.string().min(1)
      })
      .parse(request.params);

    const event = await prisma.eventLog.findUnique({
      where: {
        eventId: params.eventId
      }
    });

    if (!event) {
      return reply.status(404).send({
        error: "Event not found",
        eventId: params.eventId
      });
    }

    const payload = event.payload as {
      eventName: string;
      subjectIds: string[];
      data?: Record<string, unknown>;
    };

    try {
      for (const subjectId of payload.subjectIds ?? []) {
        await recalculateTrustScoreFromMarketplace(
          subjectId,
          toScoreRole(payload.data?.role),
          payload.eventName
        );
      }

      const updated = await prisma.eventLog.update({
        where: {
          eventId: params.eventId
        },
        data: {
          status: "PROCESSED",
          processedAt: new Date(),
          errorMessage: null
        }
      });

      return reply.status(200).send({
        eventId: updated.eventId,
        status: updated.status,
        processedAt: updated.processedAt?.toISOString() ?? null
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";

      const updated = await prisma.eventLog.update({
        where: {
          eventId: params.eventId
        },
        data: {
          status: "FAILED",
          errorMessage: message
        }
      });

      return reply.status(500).send({
        eventId: updated.eventId,
        status: updated.status,
        errorMessage: updated.errorMessage
      });
    }
  });
}
