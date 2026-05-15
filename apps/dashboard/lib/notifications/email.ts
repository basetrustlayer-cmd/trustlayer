import { Prisma } from "@prisma/client";
import { createAuditLog } from "../audit/log";

type EmailInput = {
  organizationId: string;
  userId?: string | null;
  to: string;
  subject: string;
  body: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function sendNotificationEmail(input: EmailInput) {
  const metadata: Prisma.InputJsonValue = {
    channel: "email",
    status: "queued",
    to: input.to,
    subject: input.subject,
    body: input.body,
    ...(input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
      ? input.metadata
      : {})
  };

  return createAuditLog({
    organizationId: input.organizationId,
    userId: input.userId ?? null,
    action: "notification.email.queued",
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    notes: `Email queued to ${input.to}: ${input.subject}`,
    metadata
  });
}

export function buildRenewalEmail(input: {
  organizationName: string;
  verificationUrl: string;
  status: string;
  daysUntilExpiration: number | null;
  expiresAt: string | null;
}) {
  const subject =
    input.status === "EXPIRED"
      ? `TrustLayer certification expired for ${input.organizationName}`
      : `TrustLayer certification renewal due for ${input.organizationName}`;

  const timing =
    input.status === "EXPIRED"
      ? "Your TrustLayer certification has expired."
      : `Your TrustLayer certification expires in ${input.daysUntilExpiration} days.`;

  const body = [
    `Hello,`,
    ``,
    timing,
    ``,
    `Organization: ${input.organizationName}`,
    `Expiration date: ${input.expiresAt || "Not available"}`,
    ``,
    `Renew your verification package to keep your TrustLayer badge, certificate, and public verification page active.`,
    ``,
    `Verification page: ${input.verificationUrl}`,
    ``,
    `TrustLayer`
  ].join("\n");

  return { subject, body };
}
