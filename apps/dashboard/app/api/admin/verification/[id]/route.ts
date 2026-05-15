import { NextResponse } from "next/server";
import { VerificationStatus } from "@prisma/client";
import { prisma } from "../../../../../lib/db";
import { getSessionUser } from "../../../../../lib/session";
import { createAuditLog } from "../../../../../lib/audit/log";

function isVerificationStatus(value: string): value is VerificationStatus {
  return Object.values(VerificationStatus).includes(value as VerificationStatus);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const request = await prisma.verificationRequest.findUnique({
    where: { id },
    include: {
      organization: true
    }
  });

  if (!request) {
    return NextResponse.json({ error: "Verification request not found" }, { status: 404 });
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      entityType: "VerificationRequest",
      entityId: id
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 25
  });

  return NextResponse.json({
    request,
    auditLogs
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const status = String(body.status || "");
  const notes = String(body.notes || "").trim();

  if (!isVerificationStatus(status)) {
    return NextResponse.json({ error: "Invalid verification status" }, { status: 400 });
  }

  const existing = await prisma.verificationRequest.findUnique({
    where: { id }
  });

  if (!existing) {
    return NextResponse.json({ error: "Verification request not found" }, { status: 404 });
  }

  const updated = await prisma.verificationRequest.update({
    where: { id },
    data: { status }
  });

  await createAuditLog({
    organizationId: updated.organizationId,
    userId: user.id,
    action: `verification.${status.toLowerCase()}`,
    entityType: "VerificationRequest",
    entityId: updated.id,
    notes: notes || `Status changed from ${existing.status} to ${status}`,
    metadata: {
      previousStatus: existing.status,
      newStatus: status
    }
  });

  return NextResponse.json({ request: updated });
}
