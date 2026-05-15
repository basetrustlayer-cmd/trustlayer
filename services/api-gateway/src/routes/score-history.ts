import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@trustlayer/database";

const scoreHistoryParamsSchema = z.object({
  subjectId: z.string().min(1)
});

const scoreHistoryQuerySchema = z.object({
  role: z.enum(["seller", "buyer", "worker", "hirer", "platform"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25)
});

export async function registerScoreHistoryRoutes(
  app: FastifyInstance
): Promise<void> {
  app.get("/v1/score/:subjectId/history", async (request, reply) => {
    const params = scoreHistoryParamsSchema.parse(request.params);
    const query = scoreHistoryQuerySchema.parse(request.query);

    const history = await prisma.scoreHistory.findMany({
      where: {
        subjectId: params.subjectId,
        ...(query.role ? { role: query.role } : {})
      },
      orderBy: {
        createdAt: "desc"
      },
      take: query.limit
    });

    return reply.status(200).send({
      subjectId: params.subjectId,
      role: query.role ?? null,
      count: history.length,
      history: history.map((entry) => ({
        id: entry.id,
        trustScoreId: entry.trustScoreId,
        role: entry.role,
        score: entry.score,
        tierCeiling: entry.tierCeiling,
        confidence: entry.confidence,
        factors: entry.factors,
        reason: entry.reason,
        createdAt: entry.createdAt.toISOString()
      }))
    });
  });
}
