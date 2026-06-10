import type { PublicTrustProfile } from "../domain";

export const mockTrustProfiles: PublicTrustProfile[] = [
  {
    entityId: "entity_001",
    displayName: "Ama Mensah",
    trustScore: 88,
    band: "HIGH",
    confidence: 0.89,
    verificationTier: "ENHANCED_VERIFIED",
    badgeStatus: "ACTIVE",
    publicProfileUrl: "/vendors/entity_001"
  },
  {
    entityId: "entity_002",
    displayName: "Kumasi Agro Supplies",
    trustScore: 91,
    band: "EXCELLENT",
    confidence: 0.94,
    verificationTier: "KYB_VERIFIED",
    badgeStatus: "ACTIVE",
    publicProfileUrl: "/vendors/entity_002"
  }
];
