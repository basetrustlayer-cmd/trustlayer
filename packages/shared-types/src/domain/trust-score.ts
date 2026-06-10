export type TrustScoreBand =
  | "VERY_LOW"
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "EXCELLENT";

export interface TrustScore {
  entityId: string;
  score: number;
  band: TrustScoreBand;
  confidence: number;
  verificationTier?: string;
  calculatedAt: string;
}

export interface TrustScoreFactor {
  name: string;
  weight: number;
  contribution: number;
}

export interface TrustScoreExplanation {
  entityId: string;
  score: number;
  factors: TrustScoreFactor[];
}

export interface TrustScoreHistoryEntry {
  score: number;
  reason: string;
  createdAt: string;
}

export interface TrustScoreHistory {
  entityId: string;
  history: TrustScoreHistoryEntry[];
}
