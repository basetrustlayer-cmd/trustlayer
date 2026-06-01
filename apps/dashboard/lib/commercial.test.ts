// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const caseStudy = readFileSync(
  join(process.cwd(), "docs/commercial/render-case-study.md"),
  "utf-8"
);

const playbook = readFileSync(
  join(process.cwd(), "docs/commercial/pilot-onboarding-playbook.md"),
  "utf-8"
);

describe("render-case-study.md", () => {
  it("contains the commercial one-liner", () => {
    expect(caseStudy).toContain("trust layer for African commerce");
  });

  it("documents the projection-only boundary model", () => {
    expect(caseStudy).toContain("projection-only");
  });

  it("references 12 sprint cycles", () => {
    expect(caseStudy).toContain("12 sprint cycles");
  });

  it("documents consumerTier in integration architecture", () => {
    expect(caseStudy).toContain("consumerTier");
  });

  it("documents projectionTtlSeconds", () => {
    expect(caseStudy).toContain("projectionTtlSeconds");
  });

  it("includes SafeDeal flow", () => {
    expect(caseStudy).toContain("SafeDeal");
  });

  it("lists ECOWAS expansion markets", () => {
    expect(caseStudy).toContain("Nigeria");
  });
});

describe("pilot-onboarding-playbook.md", () => {
  it("references the Render case study in Week 1", () => {
    expect(playbook).toContain("render-case-study.md");
  });

  it("references Scalar API docs in Week 1", () => {
    expect(playbook).toContain("/api-docs");
  });
});
