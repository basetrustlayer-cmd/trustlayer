import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";
import { getSessionUser } from "../../../../../lib/session";
import {
  getCertificateId,
  getCredentialLifecycle
} from "../../../../../lib/certification/lifecycle";
import { createAuditLog } from "../../../../../lib/audit/log";
import {
  buildRenewalEmail,
  sendNotificationEmail
} from "../../../../../lib/notifications/email";

function notificationActionForDays(daysUntilExpiration: number | null, status: string) {
  if (status === "EXPIRED") return "certification.renewal.expired";
  if (daysUntilExpiration !== null && daysUntilExpiration <= 7) {
    return "certification.renewal.reminder_7_days";
  }
  if (daysUntilExpiration !== null && daysUntilExpiration <= 14) {
    return "certification.renewal.reminder_14_days";
  }
  return "certification.renewal.reminder_30_days";
}

function notificationMessage(input: {
  organizationName: string;
  status: string;
  daysUntilExpiration: number | null;
}) {
  if (input.status === "EXPIRED") {
    return `${input.organizationName} certification has expired. Please renew verification.`;
  }

  return `${input.organizationName} certification expires in ${input.daysUntilExpiration} days. Renewal is recommended.`;
}

export async function POST() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const approvedRequests = await prisma.verificationRequest.findMany({
    where: {
      status: "APPROVED"
    },
    include: {
      organization: {
        include: {
          platforms: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });

  const notifications = [];

  for (const request of approvedRequests) {
    const platform = request.organization.platforms[0];

    if (!platform) {
      continue;
    }

    const subject = await prisma.subject.findFirst({
      where: { externalId: platform.userId }
    });

    const score = subject
      ? await prisma.trustScore.findUnique({
          where: {
            subjectId_role: {
              subjectId: subject.id,
              role: "platform"
            }
          }
        })
      : null;

    const lifecycle = getCredentialLifecycle({
      hasApprovedVerification: true,
      approvedVerificationUpdatedAt: request.updatedAt,
      score: score?.score ?? 0
    });

    if (
      lifecycle.status !== "RENEWAL_DUE" &&
      lifecycle.status !== "EXPIRED"
    ) {
      continue;
    }

    const action = notificationActionForDays(
      lifecycle.daysUntilExpiration,
      lifecycle.status
    );

    const existing = await prisma.auditLog.findFirst({
      where: {
        organizationId: request.organizationId,
        action,
        entityType: "VerificationRequest",
        entityId: request.id
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (existing) {
      continue;
    }

    const certificateId =
      lifecycle.issuedAt ? getCertificateId(request.id, lifecycle.issuedAt) : null;

    const notes = notificationMessage({
      organizationName: request.organization.name,
      status: lifecycle.status,
      daysUntilExpiration: lifecycle.daysUntilExpiration
    });

    const metadata: Prisma.InputJsonValue = {
      certificateId,
      platformSlug: platform.slug,
      status: lifecycle.status,
      daysUntilExpiration: lifecycle.daysUntilExpiration,
      issuedAt: lifecycle.issuedAt?.toISOString() ?? null,
      expiresAt: lifecycle.expiresAt?.toISOString() ?? null,
      renewalDueAt: lifecycle.renewalDueAt?.toISOString() ?? null
    };

    const notification = await createAuditLog({
      organizationId: request.organizationId,
      userId: user.id,
      action,
      entityType: "VerificationRequest",
      entityId: request.id,
      notes,
      metadata
    });

    const recipient = platform.contactEmail || platform.user.email;
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/verify/${platform.slug}`;
    const renewalEmail = buildRenewalEmail({
      organizationName: request.organization.name,
      verificationUrl,
      status: lifecycle.status,
      daysUntilExpiration: lifecycle.daysUntilExpiration,
      expiresAt: lifecycle.expiresAt?.toISOString().slice(0, 10) ?? null
    });

    const email = await sendNotificationEmail({
      organizationId: request.organizationId,
      userId: user.id,
      to: recipient,
      subject: renewalEmail.subject,
      body: renewalEmail.body,
      entityType: "VerificationRequest",
      entityId: request.id,
      metadata: {
        notificationAuditLogId: notification.id,
        action,
        platformSlug: platform.slug
      }
    });

    notifications.push({ notification, email });
  }

  return NextResponse.json({
    scanned: approvedRequests.length,
    notificationsCreated: notifications.length,
    emailsQueued: notifications.length,
    notifications
  });
}
