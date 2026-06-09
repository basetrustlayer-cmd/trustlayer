export type FraudGraphNode = {
  id: string;
  type: "user" | "device" | "phone" | "business" | "transaction";
  label: string;
};

export type FraudGraphEdge = {
  source: string;
  target: string;
  relationship: string;
  weight?: number;
};

export type FraudGraphResult = {
  nodes: FraudGraphNode[];
  edges: FraudGraphEdge[];
  riskLevel: "low" | "medium" | "high" | "critical";
};
