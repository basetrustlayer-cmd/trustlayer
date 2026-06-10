import { mockVerificationRequests } from "../mock";
import type { VerificationRequest } from "../domain";

export function listVerificationRequests(): VerificationRequest[] {
  return mockVerificationRequests;
}

export function getVerificationRequestById(
  id: string
): VerificationRequest | null {
  return (
    mockVerificationRequests.find(
      (verification) => verification.id === id
    ) ?? null
  );
}

export function getVerificationRequestsByEntityId(
  entityId: string
): VerificationRequest[] {
  return mockVerificationRequests.filter(
    (verification) => verification.entityId === entityId
  );
}
