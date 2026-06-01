// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderBadge, renderError } from "./badge.js";
import type { TrustScoreResponse, BadgeOptions } from "./badge.js";

function makeContainer(): HTMLElement {
  return document.createElement("div");
}

const baseOptions: BadgeOptions = {
  subjectId: "sub-001",
  apiKey: "tl_test",
  theme: "light",
  size: "md",
  baseUrl: "https://api.test.trustlayer.africa"
};

const baseScore: TrustScoreResponse = {
  subjectId: "sub-001",
  score: 72,
  consumerTier: "VERIFIED",
  verificationTier: "INDIVIDUAL",
  projectionTtlSeconds: 60,
  lastCalculatedAt: new Date().toISOString()
};

describe("renderBadge", () => {
  it("renders score in badge", () => {
    const el = makeContainer();
    renderBadge(el, baseScore, baseOptions);
    expect(el.innerHTML).toContain("Score 72");
  });

  it("renders consumerTier label", () => {
    const el = makeContainer();
    renderBadge(el, baseScore, baseOptions);
    expect(el.innerHTML).toContain("Verified");
  });

  it("renders verification mark when verificationTier is not UNVERIFIED", () => {
    const el = makeContainer();
    renderBadge(el, baseScore, baseOptions);
    expect(el.innerHTML).toContain("\u2713");
  });

  it("does not render checkmark for UNVERIFIED subject", () => {
    const el = makeContainer();
    renderBadge(el, { ...baseScore, verificationTier: "UNVERIFIED", consumerTier: "UNVERIFIED" }, baseOptions);
    expect(el.innerHTML).not.toContain("\u2713");
  });

  it("applies dark theme background", () => {
    const el = makeContainer();
    renderBadge(el, baseScore, { ...baseOptions, theme: "dark" });
    expect(el.innerHTML).toContain("#1f2937");
  });

  it("renders ENHANCED tier colour", () => {
    const el = makeContainer();
    renderBadge(el, { ...baseScore, consumerTier: "ENHANCED" }, baseOptions);
    expect(el.innerHTML).toContain("#a78bfa");
  });
});

describe("renderError", () => {
  it("renders unavailable message", () => {
    const el = makeContainer();
    renderError(el, "light");
    expect(el.innerHTML).toContain("TrustLayer unavailable");
  });
});
