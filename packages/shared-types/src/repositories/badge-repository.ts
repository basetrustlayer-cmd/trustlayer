import { mockTrustBadges } from "../mock";
import type { TrustBadge } from "../domain";

export function listTrustBadges(): TrustBadge[] {
  return mockTrustBadges;
}

export function getTrustBadgeByEntityId(
  entityId: string
): TrustBadge | null {
  return (
    mockTrustBadges.find(
      (badge) => badge.entityId === entityId
    ) ?? null
  );
}

export function hasActiveTrustBadge(
  entityId: string
): boolean {
  const badge = getTrustBadgeByEntityId(entityId);

  return badge?.status === "ACTIVE";
}
