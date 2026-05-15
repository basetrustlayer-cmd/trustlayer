import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/db";
import { getSessionUser } from "../../../../../../lib/session";
import { uploadFile } from "../../../../../../lib/storage/upload";
import { getSignedDownloadUrl } from "../../../../../../lib/storage/signed-url";
import { deleteFile } from "../../../../../../lib/storage/delete";

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organization = await getUserOrganization(user.id);

  if (!organization) {
    return NextResponse.json({ documents: [] });
  }

  const { id } = await params;

  const verificationRequest = await prisma.verificationRequest.findFirst({
    where: {
      id,
      organizationId: organization.id
    }
  });

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

  const organization = await getUserOrganization(user.id);

  if (!organization) {
    return NextResponse.json({ error: "Complete organization onboarding first" }, { status: 400 });
  }

  const { id } = await params;

  const verificationRequest = await prisma.verificationRequest.findFirst({
    where: {
      id,
      organizationId: organization.id
    }
  });

  if (!verificationRequest) {
    return NextResponse.json({ error: "Verification request not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const rawFile = formData.get("file");

  if (!rawFile || typeof rawFile === "string") {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  const file = rawFile as File;
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
      storageKey
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

  const organization = await getUserOrganization(user.id);

  if (!organization) {
    return NextResponse.json({ error: "Complete organization onboarding first" }, { status: 400 });
  }

  const { id } = await params;
  const body = await request.json();
  const documentId = String(body.documentId || "");

  const document = await prisma.verificationDocument.findFirst({
    where: {
      id: documentId,
      verificationRequestId: id,
      verificationRequest: {
        organizationId: organization.id
      }
    }
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await deleteFile(document.storageKey);
  await prisma.verificationDocument.delete({
    where: { id: document.id }
  });

  return NextResponse.json({ deleted: true });
}
