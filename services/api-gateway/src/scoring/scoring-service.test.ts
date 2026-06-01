import { describe, expect, it } from "vitest";
import { calculateTrustScoreForPersistence, mapToConsumerTier } from "./scoring-calculator.js";

describe("calculateTrustScoreForPersistence", () => {
  it("defaults unknown tiers to UNVERIFIED ceiling of 30", () => {
    const result = calculateTrustScoreForPersistence({
      subjectId: "subject_1",
      identityVerified: true,
      verificationTier: "BUSINESS_VERIFIED"
    });

    expect(result.tierCeiling).toBe(30);
    expect(result.score).toBeLessThanOrEqual(30);
  });

  it("applies BUSINESS tier ceiling of 85", () => {
    const result = calculateTrustScoreForPersistence({
      subjectId: "subject_1",
      identityVerified: true,
      verificationCount: 1,
      transactionCount: 50,
      positiveReviewCount: 10,
      negativeReviewCount: 0,
      disputeCount: 0,
      verificationTier: "BUSINESS"
    });

    expect(result.tierCeiling).toBe(85);
    expect(result.score).toBe(85);
    expect(result.tier).toBe("high_trust");
  });

  it("uses factor weights correctly", () => {
    const result = calculateTrustScoreForPersistence({
      subjectId: "subject_1",
      role: "seller",
      identityVerified: true,
      transactionCount: 5,
      positiveReviewCount: 3,
      negativeReviewCount: 1,
      disputeCount: 1,
      verificationTier: "ENHANCED"
    });

    expect(result.factors).toEqual({
      identity: 100,
      transactions: 50,
      reviews: 75,
      disputes: 75,
      roleSpecific: 50
    });

    expect(result.score).toBe(74);
    expect(result.tier).toBe("good_standing");
  });

  it("applies low-severity fraud penalty", () => {
    const clean = calculateTrustScoreForPersistence({
      subjectId: "subject_1",
      identityVerified: true,
      transactionCount: 10,
      positiveReviewCount: 5,
      negativeReviewCount: 0,
      disputeCount: 0,
      verificationTier: "ENHANCED"
    });

    const fraud = calculateTrustScoreForPersistence({
      subjectId: "subject_1",
      identityVerified: true,
      transactionCount: 10,
      positiveReviewCount: 5,
      negativeReviewCount: 0,
      disputeCount: 0,
      confirmedFraudFlag: true,
      confirmedFraudSeverity: "low",
      verificationTier: "ENHANCED"
    });

    expect(clean.score - fraud.score).toBe(25);
  });

  it("applies high-severity fraud penalty", () => {
    const clean = calculateTrustScoreForPersistence({
      subjectId: "subject_1",
      identityVerified: true,
      transactionCount: 10,
      positiveReviewCount: 5,
      negativeReviewCount: 0,
      disputeCount: 0,
      verificationTier: "ENHANCED"
    });

    const fraud = calculateTrustScoreForPersistence({
      subjectId: "subject_1",
      identityVerified: true,
      transactionCount: 10,
      positiveReviewCount: 5,
      negativeReviewCount: 0,
      disputeCount: 0,
      confirmedFraudFlag: true,
      confirmedFraudSeverity: "high",
      verificationTier: "ENHANCED"
    });

    expect(clean.score - fraud.score).toBe(50);
  });

  it("calculates confidence from evidence depth", () => {
    const result = calculateTrustScoreForPersistence({
      subjectId: "subject_1",
      identityVerified: true,
      verificationCount: 1,
      transactionCount: 5,
      positiveReviewCount: 3,
      verificationTier: "ENHANCED"
    });

    expect(result.confidence).toBe(0.95);
  });

  it("returns unscored for no evidence", () => {
    const result = calculateTrustScoreForPersistence({
      subjectId: "subject_1",
      verificationTier: "ENHANCED"
    });

    expect(result.score).toBe(15);
    expect(result.tier).toBe("unscored");
    expect(result.confidence).toBe(0.25);
  });
});

it("applies inactivity penalty after 180 days", () => {
  const active = calculateTrustScoreForPersistence({
    subjectId: "subject_1",
    identityVerified: true,
    transactionCount: 10,
    positiveReviewCount: 5,
    verificationTier: "ENHANCED",
    lastActivityAt: new Date()
  });

  const inactive = calculateTrustScoreForPersistence({
    subjectId: "subject_1",
    identityVerified: true,
    transactionCount: 10,
    positiveReviewCount: 5,
    verificationTier: "ENHANCED",
    lastActivityAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000)
  });

  expect(active.score - inactive.score).toBe(20);
});

it("caps inactivity penalty at 30 after one year", () => {
  const active = calculateTrustScoreForPersistence({
    subjectId: "subject_1",
    identityVerified: true,
    transactionCount: 10,
    positiveReviewCount: 5,
    verificationTier: "ENHANCED",
    lastActivityAt: new Date()
  });

  const stale = calculateTrustScoreForPersistence({
    subjectId: "subject_1",
    identityVerified: true,
    transactionCount: 10,
    positiveReviewCount: 5,
    verificationTier: "ENHANCED",
    lastActivityAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000)
  });

  expect(active.score - stale.score).toBe(30);
});

describe("mapToConsumerTier", () => {
  it("maps ENHANCED tier to TRUSTED", () => {
    expect(mapToConsumerTier("ENHANCED", "high_trust")).toBe("TRUSTED");
    expect(mapToConsumerTier("ENHANCED", "unscored")).toBe("TRUSTED");
  });

  it("maps BUSINESS tier to VERIFIED", () => {
    expect(mapToConsumerTier("BUSINESS", "high_trust")).toBe("VERIFIED");
    expect(mapToConsumerTier("BUSINESS", "unscored")).toBe("VERIFIED");
  });

  it("maps INDIVIDUAL tier to VERIFIED", () => {
    expect(mapToConsumerTier("INDIVIDUAL", "high_trust")).toBe("VERIFIED");
    expect(mapToConsumerTier("INDIVIDUAL", "unscored")).toBe("VERIFIED");
  });

  it("maps UNVERIFIED + unscored to NEW", () => {
    expect(mapToConsumerTier("UNVERIFIED", "unscored")).toBe("NEW");
  });

  it("maps UNVERIFIED + low/fair to BUILDING", () => {
    expect(mapToConsumerTier("UNVERIFIED", "low")).toBe("BUILDING");
    expect(mapToConsumerTier("UNVERIFIED", "fair")).toBe("BUILDING");
  });

  it("maps UNVERIFIED + good_standing/high_trust to VERIFIED", () => {
    expect(mapToConsumerTier("UNVERIFIED", "good_standing")).toBe("VERIFIED");
    expect(mapToConsumerTier("UNVERIFIED", "high_trust")).toBe("VERIFIED");
  });
});

describe("consumerTier in calculateTrustScoreForPersistence", () => {
  it("includes consumerTier and verificationTier in result", () => {
    const result = calculateTrustScoreForPersistence({
      subjectId: "subject_1",
      verificationTier: "ENHANCED"
    });

    expect(result.verificationTier).toBe("ENHANCED");
    expect(result.consumerTier).toBe("TRUSTED");
  });

  it("calculates consumerTier based on score band and verification tier", () => {
    const result = calculateTrustScoreForPersistence({
      subjectId: "subject_1",
      identityVerified: true,
      transactionCount: 50,
      positiveReviewCount: 10,
      negativeReviewCount: 0,
      verificationTier: "BUSINESS"
    });

    expect(result.consumerTier).toBe("VERIFIED");
  });
});
