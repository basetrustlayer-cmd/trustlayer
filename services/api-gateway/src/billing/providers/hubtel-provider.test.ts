import { describe, expect, it } from "vitest";
import type { HubtelWebhookPayload } from "./hubtel-provider.js";

describe("Hubtel webhook payload typing", () => {
  it("accepts a successful webhook payload", () => {
    const payload: HubtelWebhookPayload = {
      organizationId: "org_123",
      planId: "plan_123",
      status: "SUCCESS",
      customerReference: "cust_123",
      transactionId: "txn_123"
    };

    expect(payload.status).toBe("SUCCESS");
    expect(payload.transactionId).toBe("txn_123");
  });

  it("accepts a failed webhook payload", () => {
    const payload: HubtelWebhookPayload = {
      organizationId: "org_123",
      planId: "plan_123",
      status: "FAILED"
    };

    expect(payload.status).toBe("FAILED");
    expect(payload.transactionId).toBeUndefined();
  });

  it("preserves duplicate transaction IDs for idempotency checks", () => {
    const payload1: HubtelWebhookPayload = {
      organizationId: "org_123",
      planId: "plan_123",
      status: "SUCCESS",
      transactionId: "hubtel_txn_001"
    };

    const payload2: HubtelWebhookPayload = {
      organizationId: "org_123",
      planId: "plan_123",
      status: "SUCCESS",
      transactionId: "hubtel_txn_001"
    };

    expect(payload1.transactionId).toBe(payload2.transactionId);
  });
});
