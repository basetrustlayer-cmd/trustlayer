import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createFraudGraphServiceFromEnv } from "@trustlayer/fraud-graph";
import { createFraudAlert } from "../fraud-alerts/fraud-alert-service.js";

const sweepBodySchema = z.object({
  subjectIds: z.array(z.string().min(1)).min(1).max(50)
});

type SweepResult = {
  subjectId: string;
  riskLevel: "low" | "medium" | "high";
  riskScore: number;
};

export async function registerFraudSweepRoutes(
  app: FastifyInstance
): Promise<void> {
  app.post("/v1/fraud-graph/sweep", async (request, reply) => {
    if (process.env.FRAUD_GRAPH_ENABLED !== "true") {
      return reply.status(503).send({ error: "Fraud graph is not enabled" });
    }

    const parsed = sweepBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid sweep request",
        issues: parsed.error.flatten()
      });
    }

    const { subjectIds } = parsed.data;
    const fraudGraph = createFraudGraphServiceFromEnv();

    const results: SweepResult[] = [];
    const highRisk: string[] = [];
    let alertsCreated = 0;
    let consecutiveFailures = 0;
    const CIRCUIT_BREAKER_THRESHOLD = 3;

    try {
      for (const subjectId of subjectIds) {
        if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
          break;
        }

        try {
          const analytics = await fraudGraph.calculateRiskAnalytics(subjectId);
          consecutiveFailures = 0;

          results.push({
            subjectId,
            riskLevel: analytics.riskLevel,
            riskScore: analytics.riskScore
          });

          if (analytics.riskLevel === "high") {
            highRisk.push(subjectId);
            await createFraudAlert({
              subjectId,
              severity: "HIGH",
              reason: `Batch sweep: fraud graph risk ${analytics.riskScore}/100 (${analytics.connectedSubjectCount} connected subjects)`,
              source: "fraud_graph_sweep",
              metadata: {
                riskScore: analytics.riskScore,
                riskLevel: analytics.riskLevel,
                sharedIdentifierCount: analytics.sharedIdentifierCount,
                connectedSubjectCount: analytics.connectedSubjectCount,
                highestSharedIdentifierSubjectCount:
                  analytics.highestSharedIdentifierSubjectCount
              }
            });
            alertsCreated++;
          }
        } catch (err) {
          consecutiveFailures++;
          results.push({
            subjectId,
            riskLevel: "low",
            riskScore: 0
          });
        }
      }
    } finally {
      await fraudGraph.close();
    }

    const partial = consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD;

    return reply.status(200).send({
      swept: results.length,
      alerts_created: alertsCreated,
      high_risk: highRisk,
      results,
      ...(partial && {
        warning: "Circuit breaker triggered — partial results returned",
        partial: true
      })
    });
  });
}
