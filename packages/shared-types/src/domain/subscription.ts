export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELLED";

export interface Subscription {
  id: string;
  integratorId: string;
  plan: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: "PAID" | "OPEN" | "VOID";
  issuedAt: string;
}

export interface BillingUsage {
  apiRequests: number;
  verifications: number;
  trustScoreQueries: number;
}
