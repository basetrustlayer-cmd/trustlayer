import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { getSessionUser } from "../../../lib/session";
import { getRequiredDocuments } from "../../../lib/compliance/rules";
import { calculateTrustScore, getTrustScoreBand } from "../../../lib/trust-score/calculate";

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
  const requiredDocuments = profile
    ? getRequiredDocuments(profile.country, profile.industry)
    : [];

  const score = calculateTrustScore({
    companyProfileComplete: Boolean(profile),
    requiredDocuments,
    uploadedDocuments: membership.organization.complianceDocuments.map((doc) => ({
      type: String(doc.type),
      status: String(doc.status),
      expiresAt: doc.expiresAt
    }))
  });

  return NextResponse.json({
    score,
    band: getTrustScoreBand(score),
    companyProfileComplete: Boolean(profile),
    requiredDocuments,
    uploadedDocumentCount: membership.organization.complianceDocuments.length
  });
}
