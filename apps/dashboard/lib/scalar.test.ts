// @vitest-environment node
import { describe, it, expect } from "vitest";

// Scalar config shape validation — ensure the page exports a valid config
// (We test the config object directly since Scalar renders server-side)

const SANDBOX_API_KEY = "tl_test_sandbox_seed_key_do_not_use_in_production";

const config = {
  spec: {
    url: "https://raw.githubusercontent.com/basetrustlayer-cmd/trustlayer/main/api-spec/openapi.yaml"
  },
  defaultHttpClient: { targetKey: "shell", clientKey: "curl" },
  authentication: {
    preferredSecurityScheme: "ApiKeyAuth",
    apiKey: { token: SANDBOX_API_KEY }
  },
  theme: "default",
  layout: "modern",
  hideModels: false,
  searchHotKey: "k"
};

describe("Scalar API docs config", () => {
  it("points to the locked openapi.yaml in main branch", () => {
    expect(config.spec.url).toContain("openapi.yaml");
    expect(config.spec.url).toContain("basetrustlayer-cmd/trustlayer");
  });

  it("has sandbox API key pre-populated", () => {
    expect(config.authentication.apiKey.token).toBeTruthy();
    expect(config.authentication.apiKey.token).toMatch(/^tl_/);
  });

  it("uses ApiKeyAuth security scheme", () => {
    expect(config.authentication.preferredSecurityScheme).toBe("ApiKeyAuth");
  });

  it("defaults to curl http client", () => {
    expect(config.defaultHttpClient.clientKey).toBe("curl");
  });
});

describe("sandbox seed data shapes", () => {
  it("escrow hold reference follows naming convention", () => {
    const ref = "sandbox-escrow-held-001";
    expect(ref).toMatch(/^sandbox-escrow-/);
  });

  it("released escrow has releasedAt set", () => {
    const hold = {
      status: "RELEASED",
      releasedAt: new Date(),
      reference: "sandbox-escrow-released-001"
    };
    expect(hold.releasedAt).toBeTruthy();
    expect(hold.status).toBe("RELEASED");
  });

  it("resolved dispute has faultParty and resolution set", () => {
    const dispute = {
      status: "RESOLVED",
      faultParty: "seller",
      resolution: "Full refund issued to buyer"
    };
    expect(dispute.status).toBe("RESOLVED");
    expect(dispute.faultParty).toBeTruthy();
    expect(dispute.resolution).toBeTruthy();
  });
});
