import { NextResponse } from "next/server";
import { VerificationStatus } from "@prisma/client";
import { prisma } from "../../../../lib/db";
import { getSessionUser } from "../../../../lib/session";

async function getUserOrganization(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { organization: true }
  });

  return membership?.organization ?? null;
}

function isVerificationStatus(value: string): value is VerificationStatus {
  return Object.values(VerificationStatus).includes(value as VerificationStatus);
}

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organization = await getUserOrganization(user.id);

  if (!organization) {
    return NextResponse.json({ requests: [] });
  }

  const requests = await prisma.verificationRequest.findMany({
    where: { organizationId: organization.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organization = await getUserOrganization(user.id);

  if (!organization) {
    return NextResponse.json({ error: "Complete organization onboarding first" }, { status: 400 });
  }

  const body = await request.json();
  const title = String(body.title || "").trim();

  if (!title) {
    return NextResponse.json({ error: "Verification request title is required" }, { status: 400 });
  }

  const verificationRequest = await prisma.verificationRequest.create({
    data: {
      organizationId: organization.id,
      title,
      status: VerificationStatus.DRAFT
    }
  });

  return NextResponse.json({ request: verificationRequest }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organization = await getUserOrganization(user.id);

  if (!organization) {
    return NextResponse.json({ error: "Complete organization onboarding first" }, { status: 400 });
  }

  const body = await request.json();
  const id = String(body.id || "");
  const status = String(body.status || "");

  if (!id || !status) {
    return NextResponse.json({ error: "Request id and status are required" }, { status: 400 });
  }

  if (!isVerificationStatus(status)) {
    return NextResponse.json({ error: "Invalid verification status" }, { status: 400 });
  }

  const existing = await prisma.verificationRequest.findFirst({
    where: {
      id,
      organizationId: organization.id
    }
  });

  if (!existing) {
    return NextResponse.json({ error: "Verification request not found" }, { status: 404 });
  }

  const allowedTransitions: Record<VerificationStatus, VerificationStatus[]> = {
    DRAFT: [VerificationStatus.SUBMITTED],
    SUBMITTED: [VerificationStatus.IN_REVIEW],
    IN_REVIEW: [VerificationStatus.APPROVED, VerificationStatus.REJECTED],
    APPROVED: [VerificationStatus.EXPIRED],
    REJECTED: [VerificationStatus.DRAFT],
    EXPIRED: [VerificationStatus.SUBMITTED]
  };

  if (!allowedTransitions[existing.status].includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${existing.status} to ${status}` },
      { status: 400 }
    );
  }

  const updated = await prisma.verificationRequest.update({
    where: { id },
    data: { status }
  });

  return NextResponse.json({ request: updated });
}
