import { describe, expect, it } from "vitest";
import { calculateTrustScoreForPersistence } from "./scoring-calculator.js";

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
