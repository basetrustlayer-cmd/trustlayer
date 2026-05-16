import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  IdentityVerificationStatus,
  SubjectType,
  VerificationMethod
} from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../../lib/db";
import { getSessionUser } from "../../../lib/session";

const schema = z.object({
  businessName: z.string().min(2),
  registrationNumber: z.string().min(2),
  country: z.string().min(2).max(2).default("GH"),
  registry: z
    .enum(["GHANA_ORC", "NIGERIA_CAC", "US_SECRETARY_OF_STATE", "MOCK"])
    .default("MOCK")
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function tierForRegistryMatch(matched: boolean) {
  return matched ? "BUSINESS_VERIFIED" : "UNVERIFIED";
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid business verification data" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const normalizedCountry = data.country.toUpperCase();

  let organization = await prisma.organization.findFirst({
    where: {
      memberships: {
        some: {
          userId: user.id
        }
      }
    }
  });

  if (!organization) {
    const baseSlug = slugify(data.businessName);

    organization = await prisma.organization.create({
      data: {
        name: data.businessName,
        slug: `${baseSlug}-${Date.now()}`,
        memberships: {
          create: {
            userId: user.id,
            role: "OWNER"
          }
        }
      }
    });
  }

  let platform = await prisma.platform.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" }
  });

  if (!platform) {
    const baseSlug = slugify(data.businessName);

    platform = await prisma.platform.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        name: data.businessName,
        slug: `${baseSlug}-${Date.now()}`,
        contactEmail: user.email,
        planTier: "SANDBOX"
      }
    });
  } else if (!platform.organizationId) {
    platform = await prisma.platform.update({
      where: { id: platform.id },
      data: {
        organizationId: organization.id
      }
    });
  }

  const externalId = `business:${normalizedCountry}:${data.registrationNumber}`;

  let subject = await prisma.subject.findFirst({
    where: {
      externalId,
      type: SubjectType.BUSINESS
    }
  });

  if (!subject) {
    subject = await prisma.subject.create({
      data: {
        id: randomUUID(),
        type: SubjectType.BUSINESS,
        externalId,
        country: normalizedCountry,
        verificationTier: "UNVERIFIED"
      }
    });
  }

  const registryMatched = data.registry === "MOCK";
  const tierAfter = tierForRegistryMatch(registryMatched);

  const session = await prisma.verificationSession.create({
    data: {
      subjectId: subject.id,
      method: VerificationMethod.BUSINESS_ORC,
      status: registryMatched
        ? IdentityVerificationStatus.VERIFIED
        : IdentityVerificationStatus.FAILED,
      tierBefore: subject.verificationTier,
      tierAfter,
      completedAt: new Date(),
      registryResponse: {
        registry: data.registry,
        country: normalizedCountry,
        businessName: data.businessName,
        registrationNumber: data.registrationNumber,
        matched: registryMatched,
        mode: "stub"
      }
    }
  });

  const updatedSubject = await prisma.subject.update({
    where: { id: subject.id },
    data: {
      verificationTier: tierAfter,
      tierUpdatedAt: new Date()
    }
  });

  const scoreValue = registryMatched ? 70 : 20;
  const tierCeiling = registryMatched ? 85 : 30;
  const confidence = registryMatched ? 0.75 : 0.25;

  const trustScore = await prisma.trustScore.upsert({
    where: {
      subjectId_role: {
        subjectId: subject.id,
        role: "platform"
      }
    },
    update: {
      score: scoreValue,
      tierCeiling,
      confidence,
      factorIdentity: registryMatched ? 100 : 0,
      factorTransactions: 0,
      factorReviews: 0,
      factorDisputes: 100,
      factorRoleSpecific: registryMatched ? 75 : 10
    },
    create: {
      subjectId: subject.id,
      role: "platform",
      score: scoreValue,
      tierCeiling,
      confidence,
      factorIdentity: registryMatched ? 100 : 0,
      factorTransactions: 0,
      factorReviews: 0,
      factorDisputes: 100,
      factorRoleSpecific: registryMatched ? 75 : 10
    }
  });

  await prisma.scoreHistory.create({
    data: {
      trustScoreId: trustScore.id,
      subjectId: subject.id,
      role: "platform",
      score: scoreValue,
      tierCeiling,
      confidence,
      factors: {
        identity: registryMatched ? 100 : 0,
        transactions: 0,
        reviews: 0,
        disputes: 100,
        roleSpecific: registryMatched ? 75 : 10
      },
      reason: "Business registry verification completed"
    }
  });

  return NextResponse.json(
    {
      organization,
      platform,
      subject: updatedSubject,
      verificationSession: session,
      trustScore,
      source: "business_verification_stub"
    },
    { status: 201 }
  );
}
