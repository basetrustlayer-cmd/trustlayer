import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getSessionUser } from "../../../../lib/session";
import { calculateTrustScore, getTrustScoreBand } from "../../../../lib/trust-score/calculate";
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
          complianceDocuments: true,
          verificationRequests: true
        }
      }
    }
  });

  if (!membership?.organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const organization = membership.organization;
  const profile = organization.companyProfile;

  const requiredDocuments = profile
    ? getRequiredDocuments(profile.country, profile.industry)
    : [];

  const score = calculateTrustScore({
    companyProfileComplete: Boolean(profile),
    requiredDocuments,
    uploadedDocuments: organization.complianceDocuments.map((doc) => ({
      type: String(doc.type),
      status: String(doc.status),
      expiresAt: doc.expiresAt
    }))
  });

  const approvedVerification = organization.verificationRequests.some(
    (request) => request.status === "APPROVED"
  );

  const eligible = approvedVerification && score >= 70;

  return NextResponse.json({
    eligible,
    organizationName: organization.name,
    legalName: profile?.legalName || organization.name,
    country: profile?.country || null,
    industry: profile?.industry || null,
    score,
    band: getTrustScoreBand(score),
    approvedVerification,
    badgeLabel: eligible ? "TrustLayer Verified" : "TrustLayer Pending",
    issuedAt: eligible ? new Date().toISOString() : null
  });
}
