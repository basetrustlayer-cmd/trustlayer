import { Prisma } from "@prisma/client";
import { Resend } from "resend";
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

function getEmailFrom() {
  return process.env.EMAIL_FROM || "TrustLayer <notifications@trustlayer.io>";
}

function getEmailProvider() {
  return process.env.EMAIL_PROVIDER || "audit";
}

async function deliverEmail(input: EmailInput) {
  const provider = getEmailProvider();

  if (provider === "audit") {
    return {
      provider,
      providerMessageId: null,
      delivered: false
    };
  }

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error("RESEND_API_KEY must be set when EMAIL_PROVIDER=resend.");
    }

    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: getEmailFrom(),
      to: input.to,
      subject: input.subject,
      text: input.body
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      provider,
      providerMessageId: result.data?.id ?? null,
      delivered: true
    };
  }

  throw new Error(`Unsupported EMAIL_PROVIDER: ${provider}`);
}

export async function sendNotificationEmail(input: EmailInput) {
  const delivery = await deliverEmail(input);

  const metadata: Prisma.InputJsonValue = {
    channel: "email",
    status: delivery.delivered ? "sent" : "queued",
    provider: delivery.provider,
    providerMessageId: delivery.providerMessageId,
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
    action: delivery.delivered ? "notification.email.sent" : "notification.email.queued",
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    notes: `Email ${delivery.delivered ? "sent" : "queued"} to ${input.to}: ${input.subject}`,
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
