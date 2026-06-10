export type RegistryRecordStatus =
  | "VERIFIED"
  | "ENHANCED_VERIFIED"
  | "BADGE_ACTIVE"
  | "MONITORING"
  | "EXPIRED";

export interface RegistryRecord {
  entityId: string;
  displayName: string;
  entityType: string;
  trustScore: number;
  status: RegistryRecordStatus;
  verificationTier?: string;
  badgeActive: boolean;
  publicProfileUrl: string;
}

export interface RegistrySearchResult {
  total: number;
  records: RegistryRecord[];
}

export interface PublicTrustProfile {
  entityId: string;
  displayName: string;
  trustScore: number;
  band: string;
  confidence: number;
  verificationTier?: string;
  badgeStatus?: string;
  publicProfileUrl: string;
}
