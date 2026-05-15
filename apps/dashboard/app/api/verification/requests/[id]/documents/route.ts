import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/db";
import { getSessionUser } from "../../../../../../lib/session";
import { uploadFile } from "../../../../../../lib/storage/upload";
import { getSignedDownloadUrl } from "../../../../../../lib/storage/signed-url";
import { deleteFile } from "../../../../../../lib/storage/delete";
import { createAuditLog } from "../../../../../../lib/audit/log";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

async function getUserOrganization(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { organization: true }
  });

  return membership?.organization ?? null;
}

function safeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
}

async function getOwnedVerificationRequest(id: string, userId: string) {
  const organization = await getUserOrganization(userId);

  if (!organization) {
    return { organization: null, verificationRequest: null };
  }

  const verificationRequest = await prisma.verificationRequest.findFirst({
    where: {
      id,
      organizationId: organization.id
    }
  });

  return { organization, verificationRequest };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { verificationRequest } = await getOwnedVerificationRequest(id, user.id);

  if (!verificationRequest) {
    return NextResponse.json({ error: "Verification request not found" }, { status: 404 });
  }

  const documents = await prisma.verificationDocument.findMany({
    where: {
      verificationRequestId: id
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const hydratedDocuments = await Promise.all(
    documents.map(async (document) => ({
      id: document.id,
      filename: document.filename,
      contentType: document.contentType,
      sizeBytes: document.sizeBytes,
      reviewStatus: document.reviewStatus,
      reviewNotes: document.reviewNotes,
      reviewedAt: document.reviewedAt?.toISOString() ?? null,
      createdAt: document.createdAt.toISOString(),
      downloadUrl: await getSignedDownloadUrl(document.storageKey)
    }))
  );

  return NextResponse.json({ documents: hydratedDocuments });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { organization, verificationRequest } = await getOwnedVerificationRequest(id, user.id);

  if (!organization) {
    return NextResponse.json({ error: "Complete organization onboarding first" }, { status: 400 });
  }

  if (!verificationRequest) {
    return NextResponse.json({ error: "Verification request not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const rawFile = formData.get("file");

  if (!rawFile || typeof rawFile === "string") {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  const file = rawFile as File;

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = safeFilename(file.name || "verification-document");
  const storageKey = `verification-requests/${id}/${Date.now()}-${filename}`;

  await uploadFile({
    key: storageKey,
    body: bytes,
    contentType: file.type || "application/octet-stream"
  });

  const document = await prisma.verificationDocument.create({
    data: {
      verificationRequestId: id,
      uploadedById: user.id,
      filename,
      contentType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      storageKey,
      reviewStatus: "PENDING"
    }
  });

  await createAuditLog({
    organizationId: organization.id,
    userId: user.id,
    action: "verification_document.uploaded",
    entityType: "VerificationDocument",
    entityId: document.id,
    notes: `Uploaded ${filename}`,
    metadata: {
      verificationRequestId: id,
      filename,
      sizeBytes: file.size
    }
  });

  return NextResponse.json({ document }, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { organization, verificationRequest } = await getOwnedVerificationRequest(id, user.id);

  if (!organization) {
    return NextResponse.json({ error: "Complete organization onboarding first" }, { status: 400 });
  }

  if (!verificationRequest) {
    return NextResponse.json({ error: "Verification request not found" }, { status: 404 });
  }

  const body = await request.json();
  const documentId = String(body.documentId || "");

  const document = await prisma.verificationDocument.findFirst({
    where: {
      id: documentId,
      verificationRequestId: id
    }
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await deleteFile(document.storageKey);
  await prisma.verificationDocument.delete({
    where: { id: document.id }
  });

  await createAuditLog({
    organizationId: organization.id,
    userId: user.id,
    action: "verification_document.deleted",
    entityType: "VerificationDocument",
    entityId: document.id,
    notes: `Deleted ${document.filename}`,
    metadata: {
      verificationRequestId: id,
      filename: document.filename
    }
  });

  return NextResponse.json({ deleted: true });
}
