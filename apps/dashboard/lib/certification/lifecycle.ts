export const CERTIFICATE_VALIDITY_DAYS = 365;
export const RENEWAL_WINDOW_DAYS = 30;
export const CERTIFICATE_MIN_SCORE = 70;

export type CredentialLifecycleStatus =
  | "PENDING"
  | "ACTIVE"
  | "RENEWAL_DUE"
  | "EXPIRED";

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function getCertificateId(verificationId: string, issuedAt: Date) {
  return `TL-${issuedAt.getFullYear()}-${verificationId.slice(-8).toUpperCase()}`;
}

export function getCredentialLifecycle(input: {
  approvedVerificationUpdatedAt?: Date | null;
  hasApprovedVerification: boolean;
  score: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();

  if (!input.hasApprovedVerification || input.score < CERTIFICATE_MIN_SCORE) {
    return {
      eligible: false,
      verified: false,
      status: "PENDING" as CredentialLifecycleStatus,
      issuedAt: null,
      expiresAt: null,
      renewalDueAt: null,
      daysUntilExpiration: null
    };
  }

  const issuedAt = input.approvedVerificationUpdatedAt ?? now;
  const expiresAt = addDays(issuedAt, CERTIFICATE_VALIDITY_DAYS);
  const renewalDueAt = addDays(expiresAt, -RENEWAL_WINDOW_DAYS);
  const daysUntilExpiration = Math.ceil(
    (expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (expiresAt < now) {
    return {
      eligible: false,
      verified: false,
      status: "EXPIRED" as CredentialLifecycleStatus,
      issuedAt,
      expiresAt,
      renewalDueAt,
      daysUntilExpiration
    };
  }

  if (renewalDueAt <= now) {
    return {
      eligible: true,
      verified: true,
      status: "RENEWAL_DUE" as CredentialLifecycleStatus,
      issuedAt,
      expiresAt,
      renewalDueAt,
      daysUntilExpiration
    };
  }

  return {
    eligible: true,
    verified: true,
    status: "ACTIVE" as CredentialLifecycleStatus,
    issuedAt,
    expiresAt,
    renewalDueAt,
    daysUntilExpiration
  };
}
