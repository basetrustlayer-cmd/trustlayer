export type EntityType = "INDIVIDUAL" | "BUSINESS" | "ORGANIZATION";

export type RiskRole = "BUYER" | "SELLER" | "SERVICE_PROVIDER" | "FUNDS_RECIPIENT";

export type EntityVerificationStatus =
  | "UNVERIFIED"
  | "PENDING"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

export interface TrustEntity {
  id: string;
  displayName: string;
  entityType: EntityType;
  primaryRiskRole: RiskRole;
  verificationStatus: EntityVerificationStatus;
  trustScore?: number;
  createdAt: string;
  updatedAt: string;
}
