import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createFraudGraphServiceFromEnv } from "@trustlayer/fraud-graph";
import { createFraudAlert } from "../fraud-alerts/fraud-alert-service.js";

const fraudGraphParamsSchema = z.object({
  subjectId: z.string().min(1)
});

export async function registerFraudGraphRoutes(
  app: FastifyInstance
): Promise<void> {
  app.get("/v1/fraud-graph/:subjectId/risk", async (request, reply) => {
    if (process.env.FRAUD_GRAPH_ENABLED !== "true") {
      return reply.status(503).send({
        error: "Fraud graph is not enabled"
      });
    }

    const params = fraudGraphParamsSchema.parse(request.params);
    const fraudGraph = createFraudGraphServiceFromEnv();

    try {
      const analytics = await fraudGraph.calculateRiskAnalytics(params.subjectId);

      if (analytics.riskLevel === "high") {
        await createFraudAlert({
          subjectId: params.subjectId,
          severity: "HIGH",
          reason: `Fraud graph risk: ${analytics.riskScore}/100 (${analytics.connectedSubjectCount} connected subjects)`,
          source: "fraud_graph",
          metadata: {
            riskScore: analytics.riskScore,
            riskLevel: analytics.riskLevel,
            sharedIdentifierCount: analytics.sharedIdentifierCount,
            connectedSubjectCount: analytics.connectedSubjectCount,
            highestSharedIdentifierSubjectCount:
              analytics.highestSharedIdentifierSubjectCount
          }
        });
      }

      return reply.status(200).send(analytics);
    } finally {
      await fraudGraph.close();
    }
  });
}
