import { describe, expect, it } from "vitest";
import { calculateGraphRiskScore, getRiskLevel, type SharedIdentifierMatch } from "./index.js";

function match(subjectCount: number, subjectIds: string[] = []): SharedIdentifierMatch {
  return {
    identifierType: "phone",
    identifierHash: `hash_${subjectCount}`,
    subjectIds,
    subjectCount
  };
}

describe("fraud graph risk analytics", () => {
  it("returns zero risk for no shared identifiers", () => {
    expect(calculateGraphRiskScore([])).toBe(0);
  });

  it("scores one shared identifier with connected subjects", () => {
    expect(calculateGraphRiskScore([match(2, ["subject_1", "subject_2"])])).toBe(60);
  });

  it("caps high graph risk at 100", () => {
    expect(
      calculateGraphRiskScore([
        match(5, ["a", "b", "c", "d", "e"]),
        match(5, ["a", "b", "c", "d", "e"]),
        match(5, ["a", "b", "c", "d", "e"]),
        match(5, ["a", "b", "c", "d", "e"]),
        match(5, ["a", "b", "c", "d", "e"])
      ])
    ).toBe(100);
  });

  it("classifies risk boundaries", () => {
    expect(getRiskLevel(0)).toBe("low");
    expect(getRiskLevel(34)).toBe("low");
    expect(getRiskLevel(35)).toBe("medium");
    expect(getRiskLevel(69)).toBe("medium");
    expect(getRiskLevel(70)).toBe("high");
  });
});
