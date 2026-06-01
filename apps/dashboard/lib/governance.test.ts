// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "yaml";

const yamlPath = join(process.cwd(), "docs/governance/scoring-model.yaml");
const raw = readFileSync(yamlPath, "utf-8");
const model = parse(raw) as Record<string, unknown>;

describe("scoring-model.yaml", () => {
  it("parses as valid YAML", () => {
    expect(model).toBeTruthy();
  });

  it("has model.version present", () => {
    const meta = model.model as Record<string, string>;
    expect(meta.version).toBeTruthy();
    expect(meta.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("has identity weight of 0.30", () => {
    const weights = model.weights as Record<string, number>;
    expect(weights.identity).toBe(0.30);
  });

  it("weights sum to 1.00", () => {
    const weights = model.weights as Record<string, number>;
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it("has effective_date in YAML front-matter", () => {
    const meta = model.model as Record<string, string>;
    expect(meta.effective_date).toBeTruthy();
  });

  it("tier ceilings are ordered correctly", () => {
    const ceilings = (model.tiers as Record<string, Record<string, number>>).ceilings;
    expect(ceilings.UNVERIFIED).toBeLessThan(ceilings.INDIVIDUAL);
    expect(ceilings.INDIVIDUAL).toBeLessThan(ceilings.BUSINESS);
    expect(ceilings.BUSINESS).toBeLessThan(ceilings.ENHANCED);
  });
});
