import { NextResponse } from "next/server";
import { VerificationStatus } from "@prisma/client";
import { prisma } from "../../../../lib/db";
import { getSessionUser } from "../../../../lib/session";

function isAdmin(role: string) {
  return role === "ADMIN";
}

function isVerificationStatus(value: string): value is VerificationStatus {
  return Object.values(VerificationStatus).includes(value as VerificationStatus);
}

export async function GET() {
  const user = await getSessionUser();

  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requests = await prisma.verificationRequest.findMany({
    include: {
      organization: {
        include: {
          companyProfile: true,
          complianceDocuments: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return NextResponse.json({ requests });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();

  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const id = String(body.id || "");
  const status = String(body.status || "");

  if (!id || !status) {
    return NextResponse.json(
      { error: "Request id and status are required" },
      { status: 400 }
    );
  }

  if (!isVerificationStatus(status)) {
    return NextResponse.json(
      { error: "Invalid verification status" },
      { status: 400 }
    );
  }

  const existing = await prisma.verificationRequest.findUnique({
    where: { id }
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Verification request not found" },
      { status: 404 }
    );
  }

  const updated = await prisma.verificationRequest.update({
    where: { id },
    data: {
      status
    }
  });

  return NextResponse.json({ request: updated });
}
