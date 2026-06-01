import { describe, it, expect, vi, beforeEach } from "vitest";
import { TrustLayerClient } from "./client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(body: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  });
}

describe("TrustLayerClient", () => {
  let client: TrustLayerClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new TrustLayerClient({
      apiKey: "test-key",
      baseUrl: "https://api.test.trustlayer.africa"
    });
  });

  it("getTrustScore hits /v1/score/:subjectId — not /trustscore/:userId", async () => {
    mockResponse({
      subjectId: "sub-001",
      score: 72,
      tier: "VERIFIED",
      consumerTier: "VERIFIED",
      verificationTier: "INDIVIDUAL",
      lastCalculatedAt: new Date().toISOString()
    });
    const result = await client.getTrustScore("sub-001");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test.trustlayer.africa/v1/score/sub-001",
      expect.objectContaining({ method: "GET" })
    );
    expect(result.consumerTier).toBe("VERIFIED");
  });

  it("getTrustScore response includes consumerTier", async () => {
    mockResponse({
      subjectId: "sub-002",
      score: 45,
      tier: "BASIC",
      consumerTier: "BASIC",
      verificationTier: "UNVERIFIED",
      lastCalculatedAt: new Date().toISOString()
    });
    const result = await client.getTrustScore("sub-002");
    expect(result).toHaveProperty("consumerTier");
  });

  it("verifyGhanaCard posts to /v1/verify/initiate", async () => {
    mockResponse({
      subjectId: "sub-001",
      verificationSessionId: "sess-001",
      status: "OTP_SENT"
    });
    const result = await client.verifyGhanaCard("sub-001", "GHA-123456789");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test.trustlayer.africa/v1/verify/initiate",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.status).toBe("OTP_SENT");
  });

  it("retries on failure and eventually throws", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({ error: "Service unavailable" }) })
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({ error: "Service unavailable" }) })
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({ error: "Service unavailable" }) });

    await expect(client.getTrustScore("sub-001")).rejects.toThrow("Service unavailable");
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("injects X-Correlation-Id on every request", async () => {
    mockResponse({ subjectId: "sub-001", score: 72, tier: "VERIFIED",
      consumerTier: "VERIFIED", verificationTier: "INDIVIDUAL",
      lastCalculatedAt: new Date().toISOString() });
    await client.getTrustScore("sub-001");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Correlation-Id": expect.stringMatching(/^tl-/) })
      })
    );
  });
});

describe("verifyWebhookSignature", () => {
  it("returns true for valid signature", async () => {
    const { verifyWebhookSignature } = await import("./webhooks.js");
    const { createHmac } = await import("crypto");
    const secret = "whsec_test";
    const payload = JSON.stringify({ event: "trust_score.updated" });
    const sig = "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
    expect(verifyWebhookSignature(payload, sig, secret)).toBe(true);
  });

  it("returns false for tampered payload", async () => {
    const { verifyWebhookSignature } = await import("./webhooks.js");
    const { createHmac } = await import("crypto");
    const secret = "whsec_test";
    const payload = JSON.stringify({ event: "trust_score.updated" });
    const sig = "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
    expect(verifyWebhookSignature('{"event":"tampered"}', sig, secret)).toBe(false);
  });
});
