export type KycProvider = "ghana-card" | "orc" | "momo" | "manual";

export type KycCheckStatus = "pending" | "passed" | "failed" | "requires_review";

export type KycCheckResult = {
  provider: KycProvider;
  status: KycCheckStatus;
  referenceId: string;
  checkedAt: string;
  confidenceScore?: number;
};
