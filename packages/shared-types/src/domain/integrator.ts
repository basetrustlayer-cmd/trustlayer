export type IntegratorStatus =
  | "TRIAL"
  | "ACTIVE"
  | "SUSPENDED"
  | "CANCELLED";

export interface Integrator {
  id: string;
  organizationName: string;
  status: IntegratorStatus;
  trialEndsAt?: string | null;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  lastUsedAt?: string | null;
  createdAt: string;
  expiresAt?: string | null;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  active: boolean;
  events: string[];
  createdAt: string;
}

export interface UsageMetric {
  period: string;
  apiRequests: number;
  verifications: number;
  trustScoreLookups: number;
}
