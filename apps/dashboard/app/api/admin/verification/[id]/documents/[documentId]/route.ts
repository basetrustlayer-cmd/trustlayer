import { NextResponse } from "next/server";
import { prisma } from "../../../../../../../lib/db";
import { getSessionUser } from "../../../../../../../lib/session";
import { createAuditLog } from "../../../../../../../lib/audit/log";

const REVIEW_STATUSES = new Set([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "NEEDS_RESUBMISSION"
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, documentId } = await params;
  const body = await request.json();
  const reviewStatus = String(body.reviewStatus || "");
  const reviewNotes = String(body.reviewNotes || "").trim();

  if (!REVIEW_STATUSES.has(reviewStatus)) {
    return NextResponse.json({ error: "Invalid document review status" }, { status: 400 });
  }

  const existing = await prisma.verificationDocument.findFirst({
    where: {
      id: documentId,
      verificationRequestId: id
    },
    include: {
      verificationRequest: true
    }
  });

  if (!existing) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const updated = await prisma.verificationDocument.update({
    where: { id: documentId },
    data: {
      reviewStatus,
      reviewNotes: reviewNotes || null,
      reviewedById: user.id,
      reviewedAt: new Date()
    }
  });

  await createAuditLog({
    organizationId: existing.verificationRequest.organizationId,
    userId: user.id,
    action: `verification_document.${reviewStatus.toLowerCase()}`,
    entityType: "VerificationDocument",
    entityId: updated.id,
    notes: reviewNotes || `Document marked as ${reviewStatus}`,
    metadata: {
      verificationRequestId: id,
      previousStatus: existing.reviewStatus,
      newStatus: reviewStatus,
      filename: existing.filename
    }
  });

  return NextResponse.json({ document: updated });
}
