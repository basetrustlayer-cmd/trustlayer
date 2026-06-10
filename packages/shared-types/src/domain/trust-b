export type TrustBadgeStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "EXPIRED"
  | "REVOKED";

export interface TrustBadge {
  entityId: string;
  badgeLabel: string;
  status: TrustBadgeStatus;
  verificationUrl: string;
  badgeImageUrl: string;
  issuedAt?: string | null;
  expiresAt?: string | null;
}

export interface BadgeEligibility {
  eligible: boolean;
  approvedVerification: boolean;
  approvedDocuments: number;
  totalDocuments: number;
  minimumScoreRequired: number;
  currentScore: number;
}

export interface BadgeCertificate {
  certificateId: string;
  entityId: string;
  verificationUrl: string;
  issuedAt: string;
  expiresAt?: string | null;
}

export interface BadgeEmbed {
  entityId: string;
  embedCode: string;
  badgeImageUrl: string;
}
