import type { TrustBadge } from "../domain";

export const mockTrustBadges: TrustBadge[] = [
  {
    entityId: "entity_001",
    badgeLabel: "Enhanced Verified",
    status: "ACTIVE",
    verificationUrl: "/vendors/entity_001",
    badgeImageUrl: "/api/certification/badge/entity_001.svg",
    issuedAt: "2026-06-03T00:00:00.000Z",
    expiresAt: "2027-06-03T00:00:00.000Z"
  },
  {
    entityId: "entity_002",
    badgeLabel: "KYB Verified",
    status: "ACTIVE",
    verificationUrl: "/vendors/entity_002",
    badgeImageUrl: "/api/certification/badge/entity_002.svg",
    issuedAt: "2026-06-08T00:00:00.000Z",
    expiresAt: "2027-06-08T00:00:00.000Z"
  }
];
