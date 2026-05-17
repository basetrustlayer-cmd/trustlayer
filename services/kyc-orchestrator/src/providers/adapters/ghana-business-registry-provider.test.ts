import { describe, expect, it } from "vitest";
import { KycProviderError } from "../../errors/provider-error";
import { GhanaBusinessRegistryProvider } from "./ghana-business-registry-provider";

describe("GhanaBusinessRegistryProvider", () => {
  const provider = new GhanaBusinessRegistryProvider();

  it("supports GH business ORC verification", () => {
    expect(
      provider.supports({
        subjectId: "subject_1",
        subjectType: "BUSINESS",
        method: "BUSINESS_ORC",
        country: "GH"
      })
    ).toBe(true);
  });

  it("does not support non-GH business ORC verification", () => {
    expect(
      provider.supports({
        subjectId: "subject_1",
        subjectType: "BUSINESS",
        method: "BUSINESS_ORC",
        country: "NG"
      })
    ).toBe(false);
  });

  it("throws when businessRegistrationNumber is missing", async () => {
    await expect(
      provider.verify({
        subjectId: "subject_1",
        subjectType: "BUSINESS",
        method: "BUSINESS_ORC",
        country: "GH"
      })
    ).rejects.toBeInstanceOf(KycProviderError);
  });

  it("returns verified mock ORC result when registration number exists", async () => {
    const result = await provider.verify({
      subjectId: "subject_1",
      subjectType: "BUSINESS",
      method: "BUSINESS_ORC",
      country: "GH",
      businessRegistrationNumber: "CS123456789"
    });

    expect(result.provider).toBe("BUSINESS_REGISTRY");
    expect(result.status).toBe("VERIFIED");
    expect(result.verified).toBe(true);
    expect(result.confidence).toBe(0.8);
    expect(result.reference).toBe("ghana_orc_subject_1");
  });
});
