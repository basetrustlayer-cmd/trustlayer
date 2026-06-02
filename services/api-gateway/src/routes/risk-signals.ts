import { randomUUID } from "crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createFraudAlert } from "../fraud-alerts/fraud-alert-service.js";
import { prisma } from "@trustlayer/database";

const riskSignalSchema = z.object({
  subjectId: z.string().min(1),
  signalType: z.enum([
    "DISPUTE_CLUSTER",
    "ESCROW_BEHAVIOR",
    "ACCOUNT_VELOCITY",
    "PAYMENT_ANOMALY",
    "DEVICE_MISMATCH",
    "MESSAGE_ABUSE"
  ]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  metadata: z.record(z.unknown()).optional()
});

export async function registerRiskSignalRoutes(
  app: FastifyInstance
): Promise<void> {
  app.post("/v1/marketplace/risk-signals", async (request, reply) => {
    const parsed = riskSignalSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid risk signal request",
        issues: parsed.error.flatten()
      });
    }

    const { subjectId, signalType, severity, metadata } = parsed.data;

    // Persist signal for analyst review — advisory only, never modifies tier or score
    try {
      await prisma.eventLog.create({
        data: {
          eventId: randomUUID(),
          topic: "marketplace.risk_signals",
          eventName: "marketplace.risk_signal",
          payload: JSON.parse(JSON.stringify({
            subjectId,
            signalType,
            severity,
            metadata: metadata ?? {},
            source: "marketplace_consumer"
          })),
          status: "RECEIVED"
        }
      });
    } catch (err) {
      // Log but never surface — response is always 202 (TDD §8.3)
      console.warn("risk-signal: eventLog write failed", { subjectId, signalType, err });
    }

    // HIGH or CRITICAL signals create a FraudAlert for analyst review
    if (severity === "HIGH" || severity === "CRITICAL") {
      try {
        await createFraudAlert({
          subjectId,
          severity: "HIGH",
          reason: `Marketplace risk signal: ${signalType}`,
          source: "marketplace_signal",
          metadata: {
            signalType,
            reportedSeverity: severity,
            ...(metadata ?? {})
          }
        });
      } catch (err) {
        console.warn("risk-signal: FraudAlert creation failed", { subjectId, signalType, err });
      }
    }

    // Always 202 — TrustLayer never confirms or denies what action was taken (TDD §8.3)
    return reply.status(202).send({
      received: true,
      signalType,
      subjectId
    });
  });
}
