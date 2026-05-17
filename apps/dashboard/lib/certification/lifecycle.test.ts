import { describe, expect, it } from "vitest";
import {
  addDays,
  getCertificateId,
  getCredentialLifecycle
} from "./lifecycle";

describe("certification lifecycle", () => {
  const now = new Date("2026-05-17T00:00:00.000Z");

  it("returns PENDING when there is no approved verification", () => {
    const result = getCredentialLifecycle({
      hasApprovedVerification: false,
      score: 100,
      now
    });

    expect(result.status).toBe("PENDING");
    expect(result.eligible).toBe(false);
    expect(result.verified).toBe(false);
  });

  it("returns PENDING when score is below minimum", () => {
    const result = getCredentialLifecycle({
      hasApprovedVerification: true,
      score: 69,
      now
    });

    expect(result.status).toBe("PENDING");
  });

  it("returns ACTIVE before renewal window", () => {
    const result = getCredentialLifecycle({
      hasApprovedVerification: true,
      approvedVerificationUpdatedAt: new Date("2026-01-01T00:00:00.000Z"),
      score: 85,
      now
    });

    expect(result.status).toBe("ACTIVE");
    expect(result.eligible).toBe(true);
    expect(result.verified).toBe(true);
  });

  it("returns RENEWAL_DUE inside renewal window", () => {
    const result = getCredentialLifecycle({
      hasApprovedVerification: true,
      approvedVerificationUpdatedAt: new Date("2025-06-01T00:00:00.000Z"),
      score: 85,
      now
    });

    expect(result.status).toBe("RENEWAL_DUE");
    expect(result.daysUntilExpiration).toBeGreaterThan(0);
  });

  it("returns EXPIRED after expiration", () => {
    const result = getCredentialLifecycle({
      hasApprovedVerification: true,
      approvedVerificationUpdatedAt: new Date("2025-01-01T00:00:00.000Z"),
      score: 85,
      now
    });

    expect(result.status).toBe("EXPIRED");
    expect(result.eligible).toBe(false);
    expect(result.verified).toBe(false);
  });

  it("adds days correctly", () => {
    expect(addDays(now, 10).toISOString()).toBe("2026-05-27T00:00:00.000Z");
  });

  it("creates stable certificate IDs", () => {
    expect(getCertificateId("verification_abcdef12", now)).toBe("TL-2026-ABCDEF12");
  });
});
