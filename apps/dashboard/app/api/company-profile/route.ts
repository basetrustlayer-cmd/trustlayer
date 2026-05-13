import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/db";
import { getSessionUser } from "../../../lib/session";

const schema = z.object({
  legalName: z.string().min(2),
  tradeName: z.string().optional(),
  entityType: z.string().min(2),
  taxId: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  addressLine1: z.string().min(2),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(2),
  country: z.string().default("US"),
  industry: z.string().min(2)
});

async function getOrCreateOrganization(userId: string, legalName?: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { organization: true }
  });

  if (membership) return membership.organization;

  const baseName = legalName || "New Organization";
  const slug = `${baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;

  const organization = await prisma.organization.create({
    data: {
      name: baseName,
      slug,
      memberships: {
        create: {
          userId,
          role: "OWNER"
        }
      }
    }
  });

  return organization;
}

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: {
      organization: {
        include: {
          companyProfile: true
        }
      }
    }
  });

  return NextResponse.json({
    companyProfile: membership?.organization.companyProfile ?? null
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid company profile data" }, { status: 400 });
  }

  const organization = await getOrCreateOrganization(user.id, parsed.data.legalName);

  const profile = await prisma.companyProfile.upsert({
    where: {
      organizationId: organization.id
    },
    create: {
      organizationId: organization.id,
      ...parsed.data
    },
    update: parsed.data
  });

  await prisma.organization.update({
    where: { id: organization.id },
    data: { name: parsed.data.legalName }
  });

  return NextResponse.json({ companyProfile: profile });
}
