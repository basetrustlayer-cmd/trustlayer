import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@trustlayer/database";

const leaderboardQuerySchema = z.object({
  role: z.enum(["seller", "buyer", "worker", "hirer", "platform"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25)
});

export async function registerLeaderboardRoutes(
  app: FastifyInstance
): Promise<void> {
  app.get("/v1/leaderboard", async (request, reply) => {
    const query = leaderboardQuerySchema.parse(request.query);

    const scores = await prisma.trustScore.findMany({
      where: {
        ...(query.role ? { role: query.role } : {})
      },
      orderBy: [
        { score: "desc" },
        { confidence: "desc" },
        { updatedAt: "desc" }
      ],
      take: query.limit,
      include: {
        subject: true
      }
    });

    return reply.status(200).send({
      role: query.role ?? null,
      count: scores.length,
      leaderboard: scores.map((entry, index) => ({
        rank: index + 1,
        subjectId: entry.subjectId,
        externalId: entry.subject.externalId,
        subjectType: entry.subject.type,
        country: entry.subject.country,
        verificationTier: entry.subject.verificationTier,
        role: entry.role,
        score: entry.score,
        tierCeiling: entry.tierCeiling,
        confidence: entry.confidence,
        factors: {
          identity: entry.factorIdentity,
          transactions: entry.factorTransactions,
          reviews: entry.factorReviews,
          disputes: entry.factorDisputes,
          roleSpecific: entry.factorRoleSpecific
        },
        updatedAt: entry.updatedAt.toISOString()
      }))
    });
  });
}
