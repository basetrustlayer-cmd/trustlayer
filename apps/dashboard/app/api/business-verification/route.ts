import { createHash, randomUUID } from "crypto";
import { recalculateTrustScoreFromMarketplace } from "../../../lib/recalculate-trust-score";
import { NextResponse } from "next/server";
import {
  IdentityVerificationStatus,
  Prisma,
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
  return matched ? "BUSINESS" : "UNVERIFIED";
}

function hashSensitiveIdentifier(value: string) {
  return createHash("sha256").update(value.trim().toUpperCase()).digest("hex");
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

  const registrationNumberHash = hashSensitiveIdentifier(data.registrationNumber);
  const externalId = `business:${normalizedCountry}:${registrationNumberHash}`;

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

  const verificationResult = {
    provider: data.registry,
    status: "VERIFIED" as const,
    verified: true,
    confidence: data.registry === "MOCK" ? 0.75 : 0.85,
    reference: `dashboard_business_${subject.id}`,
    raw: {
      registry: data.registry,
      country: normalizedCountry,
      businessName: data.businessName,
      registrationNumberHash,
      matched: true,
      mode: "dashboard_sandbox"
    }
  };

  const registryMatched = verificationResult.verified;
  const tierAfter = tierForRegistryMatch(registryMatched);

  const registryResponse = {
    registry: data.registry,
    country: normalizedCountry,
    businessName: data.businessName,
    registrationNumberHash,
    matched: registryMatched,
    provider: verificationResult.provider,
    reference: verificationResult.reference,
    raw: verificationResult.raw as Prisma.InputJsonValue
  } satisfies Prisma.InputJsonObject;

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
      registryResponse
    }
  });

  const updatedSubject = await prisma.subject.update({
    where: { id: subject.id },
    data: {
      verificationTier: tierAfter,
      tierUpdatedAt: new Date()
    }
  });

  await recalculateTrustScoreFromMarketplace(
    subject.id,
    "platform",
    registryMatched ? "business.verified" : "business.verification_failed"
  );

  const trustScore = await prisma.trustScore.findUniqueOrThrow({
    where: {
      subjectId_role: {
        subjectId: subject.id,
        role: "platform"
      }
    }
  });

  return NextResponse.json(
    {
      organization,
      platform,
      subject: updatedSubject,
      verificationSession: session,
      trustScore,
      source: "business_verification_provider"
    },
    { status: 201 }
  );
}
