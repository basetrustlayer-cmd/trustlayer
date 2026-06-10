export type VerificationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

export type VerificationType =
  | "KYC"
  | "KYB"
  | "DOCUMENT"
  | "ENHANCED";

export interface VerificationRequest {
  id: string;
  entityId: string;
  title: string;
  verificationType: VerificationType;
  status: VerificationStatus;
  createdAt: string;
  updatedAt: string;
}

export type DocumentReviewStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "NEEDS_RESUBMISSION";

export interface VerificationDocument {
  id: string;
  verificationRequestId: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  reviewStatus: DocumentReviewStatus;
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface VerificationAuditLog {
  id: string;
  verificationRequestId: string;
  action: string;
  notes?: string | null;
  metadata?: unknown;
  createdAt: string;
}
