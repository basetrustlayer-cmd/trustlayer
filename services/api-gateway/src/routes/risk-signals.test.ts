// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateFraudAlert, mockEventLogCreate } = vi.hoisted(() => ({
  mockCreateFraudAlert: vi.fn(),
  mockEventLogCreate: vi.fn().mockResolvedValue({ id: "log-001" })
}));

vi.mock("@trustlayer/database", () => ({
  prisma: {
    eventLog: { create: mockEventLogCreate }
  }
}));

vi.mock("../fraud-alerts/fraud-alert-service.js", () => ({
  createFraudAlert: mockCreateFraudAlert
}));

import Fastify from "fastify";
import { registerRiskSignalRoutes } from "./risk-signals.js";

async function buildApp() {
  const app = Fastify();
  await registerRiskSignalRoutes(app);
  return app;
}

describe("POST /v1/marketplace/risk-signals", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 202 for valid LOW signal — no FraudAlert created", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/marketplace/risk-signals",
      payload: { subjectId: "sub-001", signalType: "DISPUTE_CLUSTER", severity: "LOW" }
    });
    expect(res.statusCode).toBe(202);
    expect(res.json()).toMatchObject({ received: true, signalType: "DISPUTE_CLUSTER", subjectId: "sub-001" });
    expect(mockCreateFraudAlert).not.toHaveBeenCalled();
  });

  it("returns 202 for valid MEDIUM signal — no FraudAlert created", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/marketplace/risk-signals",
      payload: { subjectId: "sub-001", signalType: "ESCROW_BEHAVIOR", severity: "MEDIUM" }
    });
    expect(res.statusCode).toBe(202);
    expect(mockCreateFraudAlert).not.toHaveBeenCalled();
  });

  it("returns 202 for HIGH signal — FraudAlert created with source=marketplace_signal", async () => {
    mockCreateFraudAlert.mockResolvedValue({ id: "alert-001" });
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/marketplace/risk-signals",
      payload: { subjectId: "sub-002", signalType: "ACCOUNT_VELOCITY", severity: "HIGH" }
    });
    expect(res.statusCode).toBe(202);
    expect(mockCreateFraudAlert).toHaveBeenCalledWith(
      expect.objectContaining({ subjectId: "sub-002", severity: "HIGH", source: "marketplace_signal" })
    );
  });

  it("returns 202 for CRITICAL signal — FraudAlert created", async () => {
    mockCreateFraudAlert.mockResolvedValue({ id: "alert-002" });
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/marketplace/risk-signals",
      payload: { subjectId: "sub-003", signalType: "PAYMENT_ANOMALY", severity: "CRITICAL" }
    });
    expect(res.statusCode).toBe(202);
    expect(mockCreateFraudAlert).toHaveBeenCalledTimes(1);
  });

  it("response body never reveals internal action", async () => {
    mockCreateFraudAlert.mockResolvedValue({ id: "alert-003" });
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/marketplace/risk-signals",
      payload: { subjectId: "sub-004", signalType: "DEVICE_MISMATCH", severity: "HIGH" }
    });
    const body = res.json();
    expect(Object.keys(body)).toEqual(["received", "signalType", "subjectId"]);
    expect(body.alertCreated).toBeUndefined();
    expect(body.action).toBeUndefined();
  });

  it("returns 400 for invalid signalType", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/marketplace/risk-signals",
      payload: { subjectId: "sub-001", signalType: "INVALID_TYPE", severity: "LOW" }
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when subjectId is missing", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/marketplace/risk-signals",
      payload: { signalType: "DISPUTE_CLUSTER", severity: "HIGH" }
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 202 even when FraudAlert creation fails — never surfaces internal errors", async () => {
    mockCreateFraudAlert.mockRejectedValue(new Error("DB connection failed"));
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/marketplace/risk-signals",
      payload: { subjectId: "sub-005", signalType: "MESSAGE_ABUSE", severity: "CRITICAL" }
    });
    expect(res.statusCode).toBe(202);
  });
});
