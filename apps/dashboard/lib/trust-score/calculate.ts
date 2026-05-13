type DocumentInput = {
  type: string;
  status: string;
  expiresAt?: string | Date | null;
};

type TrustScoreInput = {
  requiredDocuments: string[];
  uploadedDocuments: DocumentInput[];
  companyProfileComplete: boolean;
};

export function calculateTrustScore(input: TrustScoreInput) {
  let score = 0;

  if (input.companyProfileComplete) {
    score += 20;
  }

  const uploadedTypes = new Set(input.uploadedDocuments.map((doc) => String(doc.type)));
  const requiredCount = input.requiredDocuments.length || 1;
  const completedRequiredCount = input.requiredDocuments.filter((type) => uploadedTypes.has(type)).length;

  score += Math.round((completedRequiredCount / requiredCount) * 40);

  const approvedCount = input.uploadedDocuments.filter((doc) => doc.status === "APPROVED").length;
  const submittedOrReviewCount = input.uploadedDocuments.filter((doc) =>
    ["SUBMITTED", "IN_REVIEW"].includes(doc.status)
  ).length;

  score += Math.min(20, approvedCount * 5 + submittedOrReviewCount * 2);

  const expiredCount = input.uploadedDocuments.filter((doc) => {
    if (!doc.expiresAt) return false;
    return new Date(doc.expiresAt).getTime() < Date.now();
  }).length;

  score -= expiredCount * 10;

  const missingCount = input.requiredDocuments.filter((type) => !uploadedTypes.has(type)).length;
  score -= missingCount * 5;

  return Math.max(0, Math.min(100, score));
}

export function getTrustScoreBand(score: number) {
  if (score >= 85) return "HIGH_TRUST";
  if (score >= 65) return "VERIFICATION_READY";
  if (score >= 40) return "IN_PROGRESS";
  return "LOW_TRUST";
}
