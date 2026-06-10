import type { VerificationRequest } from "../domain";

export const mockVerificationRequests: VerificationRequest[] = [
  {
    id: "ver_001",
    entityId: "entity_001",
    title: "Individual identity verification",
    verificationType: "KYC",
    status: "APPROVED",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-03T00:00:00.000Z"
  },
  {
    id: "ver_002",
    entityId: "entity_002",
    title: "Business verification package",
    verificationType: "KYB",
    status: "IN_REVIEW",
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-08T00:00:00.000Z"
  }
];
