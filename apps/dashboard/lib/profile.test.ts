// @vitest-environment node
import { describe, it, expect } from "vitest";

function scoreDisplay(score: { confidence: number }): {
  showNumeric: boolean;
  qualifier: string | null;
} {
  if (score.confidence >= 0.70) return { showNumeric: true, qualifier: null };
  if (score.confidence >= 0.40) return { showNumeric: true, qualifier: "limited data" };
  return { showNumeric: false, qualifier: null };
}

describe("Amendment F confidence display rules", () => {
  it("confidence >= 0.70: shows numeric score, no qualifier", () => {
    const result = scoreDisplay({ confidence: 0.85 });
    expect(result.showNumeric).toBe(true);
    expect(result.qualifier).toBeNull();
  });

  it("confidence 0.70 boundary: shows numeric score", () => {
    const result = scoreDisplay({ confidence: 0.70 });
    expect(result.showNumeric).toBe(true);
    expect(result.qualifier).toBeNull();
  });

  it("confidence 0.55: shows score with limited data qualifier", () => {
    const result = scoreDisplay({ confidence: 0.55 });
    expect(result.showNumeric).toBe(true);
    expect(result.qualifier).toBe("limited data");
  });

  it("confidence 0.40 boundary: shows score with limited data qualifier", () => {
    const result = scoreDisplay({ confidence: 0.40 });
    expect(result.showNumeric).toBe(true);
    expect(result.qualifier).toBe("limited data");
  });

  it("confidence < 0.40: suppresses numeric score", () => {
    const result = scoreDisplay({ confidence: 0.25 });
    expect(result.showNumeric).toBe(false);
    expect(result.qualifier).toBeNull();
  });

  it("confidence 0.00: suppresses numeric score", () => {
    const result = scoreDisplay({ confidence: 0.00 });
    expect(result.showNumeric).toBe(false);
  });
});
