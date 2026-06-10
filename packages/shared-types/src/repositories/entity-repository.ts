import { mockTrustProfiles } from "../mock";
import type { PublicTrustProfile } from "../domain";

export function listTrustProfiles(): PublicTrustProfile[] {
  return mockTrustProfiles;
}

export function getTrustProfileByEntityId(
  entityId: string
): PublicTrustProfile | null {
  return mockTrustProfiles.find((profile) => profile.entityId === entityId) ?? null;
}
