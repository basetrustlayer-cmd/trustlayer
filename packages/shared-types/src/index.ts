export type TrustLayerHealthStatus = {
  status: "ok";
  service: string;
};

export type Organization = {
  id: string;
  name: string;
  createdAt: string;
};

export type ScoreBand =
  | "high_trust"
  | "good_standing"
  | "fair"
  | "low"
  | "unscored";

export type ConsumerTier =
  | "NEW"
  | "BUILDING"
  | "VERIFIED"
  | "TRUSTED";
