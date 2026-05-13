import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getSessionUser } from "../../../../lib/session";
import { getRequiredDocuments } from "../../../../lib/compliance/rules";

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
          companyProfile: true,
          complianceDocuments: true
        }
      }
    }
  });

  if (!membership?.organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const profile = membership.organization.companyProfile;

  if (!profile) {
    return NextResponse.json({
      completionPercentage: 0,
      status: "COMPANY_PROFILE_REQUIRED",
      requiredDocuments: [],
      uploadedDocuments: [],
      missingDocuments: []
    });
  }

  const requiredDocuments = getRequiredDocuments(profile.country, profile.industry);
  const uploadedTypes = new Set(
    membership.organization.complianceDocuments.map((doc) => String(doc.type))
  );

  const missingDocuments = requiredDocuments.filter((type) => !uploadedTypes.has(type));

  const approvedOrSubmitted = membership.organization.complianceDocuments.filter((doc) =>
    requiredDocuments.includes(String(doc.type))
  );

  const completionPercentage =
    requiredDocuments.length === 0
      ? 100
      : Math.round((approvedOrSubmitted.length / requiredDocuments.length) * 100);

  const expiredDocuments = membership.organization.complianceDocuments.filter((doc) => {
    if (!doc.expiresAt) return false;
    return new Date(doc.expiresAt).getTime() < Date.now();
  });

  return NextResponse.json({
    country: profile.country,
    industry: profile.industry,
    completionPercentage,
    status:
      missingDocuments.length === 0 && expiredDocuments.length === 0
        ? "COMPLIANT"
        : "ACTION_REQUIRED",
    requiredDocuments,
    uploadedDocuments: membership.organization.complianceDocuments,
    missingDocuments,
    expiredDocuments
  });
}
