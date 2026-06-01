// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCalculateRiskAnalytics, mockCreateFraudAlert, mockClose } = vi.hoisted(() => ({
  mockCalculateRiskAnalytics: vi.fn(),
  mockCreateFraudAlert: vi.fn(),
  mockClose: vi.fn().mockResolvedValue(undefined)
}));

vi.mock("@trustlayer/fraud-graph", () => ({
  createFraudGraphServiceFromEnv: () => ({
    calculateRiskAnalytics: mockCalculateRiskAnalytics,
    close: mockClose
  })
}));

vi.mock("../fraud-alerts/fraud-alert-service.js", () => ({
  createFraudAlert: mockCreateFraudAlert
}));

import Fastify from "fastify";
import { registerFraudSweepRoutes } from "./fraud-sweep.js";

async function buildApp() {
  const app = Fastify();
  await registerFraudSweepRoutes(app);
  return app;
}

describe("POST /v1/fraud-graph/sweep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FRAUD_GRAPH_ENABLED = "true";
  });

  it("returns 503 when FRAUD_GRAPH_ENABLED is not true", async () => {
    process.env.FRAUD_GRAPH_ENABLED = "false";
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/fraud-graph/sweep",
      payload: { subjectIds: ["sub-001"] }
    });
    expect(res.statusCode).toBe(503);
  });

  it("returns 400 when subjectIds exceeds 50", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/fraud-graph/sweep",
      payload: { subjectIds: Array.from({ length: 51 }, (_, i) => "sub-" + i) }
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when subjectIds is empty", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/fraud-graph/sweep",
      payload: { subjectIds: [] }
    });
    expect(res.statusCode).toBe(400);
  });

  it("creates FraudAlert for high-risk subject, not for low-risk", async () => {
    mockCalculateRiskAnalytics
      .mockResolvedValueOnce({
        subjectId: "sub-A",
        riskLevel: "high",
        riskScore: 80,
        sharedIdentifierCount: 2,
        connectedSubjectCount: 3,
        highestSharedIdentifierSubjectCount: 2,
        sharedIdentifiers: []
      })
      .mockResolvedValueOnce({
        subjectId: "sub-B",
        riskLevel: "low",
        riskScore: 10,
        sharedIdentifierCount: 0,
        connectedSubjectCount: 0,
        highestSharedIdentifierSubjectCount: 0,
        sharedIdentifiers: []
      });
    mockCreateFraudAlert.mockResolvedValue({ id: "alert-001" });

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/fraud-graph/sweep",
      payload: { subjectIds: ["sub-A", "sub-B"] }
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.swept).toBe(2);
    expect(body.alerts_created).toBe(1);
    expect(body.high_risk).toEqual(["sub-A"]);
    expect(body.results).toHaveLength(2);
    expect(body.results.find((r: { subjectId: string }) => r.subjectId === "sub-A").riskLevel).toBe("high");
    expect(body.results.find((r: { subjectId: string }) => r.subjectId === "sub-B").riskLevel).toBe("low");
    expect(mockCreateFraudAlert).toHaveBeenCalledTimes(1);
    expect(mockCreateFraudAlert).toHaveBeenCalledWith(
      expect.objectContaining({ subjectId: "sub-A", severity: "HIGH", source: "fraud_graph_sweep" })
    );
  });

  it("triggers circuit breaker after 3 consecutive failures", async () => {
    mockCalculateRiskAnalytics.mockRejectedValue(new Error("Neo4j connection failed"));

    const app = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/v1/fraud-graph/sweep",
      payload: { subjectIds: ["sub-1", "sub-2", "sub-3", "sub-4", "sub-5"] }
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.partial).toBe(true);
    expect(body.swept).toBe(3);
    expect(mockCalculateRiskAnalytics).toHaveBeenCalledTimes(3);
  });
});
