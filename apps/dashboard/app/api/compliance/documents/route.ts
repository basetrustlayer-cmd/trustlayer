import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getSessionUser } from "../../../../lib/session";

async function getUserOrganization(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { organization: true }
  });

  return membership?.organization ?? null;
}

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organization = await getUserOrganization(user.id);

  if (!organization) {
    return NextResponse.json({ documents: [] });
  }

  const documents = await prisma.complianceDocument.findMany({
    where: { organizationId: organization.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organization = await getUserOrganization(user.id);

  if (!organization) {
    return NextResponse.json({ error: "Complete company onboarding first" }, { status: 400 });
  }

  const formData = await request.formData();

  const file = formData.get("file") as File | null;
  const type = String(formData.get("type") || "");
  const title = String(formData.get("title") || "");
  const notes = String(formData.get("notes") || "");

  if (!file || !type || !title) {
    return NextResponse.json({ error: "Missing required document data" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "uploads", "compliance", organization.id);
  await mkdir(uploadDir, { recursive: true });

  const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = path.join(uploadDir, safeFileName);

  await writeFile(filePath, buffer);

  const document = await prisma.complianceDocument.create({
    data: {
      organizationId: organization.id,
      type: type as any,
      title,
      fileName: file.name,
      filePath,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      notes: notes || null
    }
  });

  return NextResponse.json({ document });
}
