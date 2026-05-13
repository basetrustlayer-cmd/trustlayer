import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../lib/db";
import { getRequiredDocuments } from "../../../lib/compliance/rules";
import { calculateTrustScore, getTrustScoreBand } from "../../../lib/trust-score/calculate";

function formatBand(band: string) {
  return band
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function VendorProfilePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      companyProfile: true,
      complianceDocuments: true,
      verificationRequests: true
    }
  });

  if (!organization?.companyProfile) {
    notFound();
  }

  const profile = organization.companyProfile;
  const requiredDocuments = getRequiredDocuments(profile.country, profile.industry);

  const score = calculateTrustScore({
    companyProfileComplete: true,
    requiredDocuments,
    uploadedDocuments: organization.complianceDocuments.map((doc) => ({
      type: String(doc.type),
      status: String(doc.status),
      expiresAt: doc.expiresAt
    }))
  });

  const verified = organization.verificationRequests.some(
    (request) => request.status === "APPROVED"
  );

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 860 }}>
      <h1>{profile.tradeName || profile.legalName}</h1>
      <p>{verified ? "TrustLayer Verified" : "Verification Pending"}</p>

      <section style={{ marginTop: 24, padding: 24, border: "1px solid #ddd", borderRadius: 8 }}>
        <h2>Trust Profile</h2>
        <p><strong>Trust Score:</strong> {score}/100</p>
        <p><strong>Band:</strong> {formatBand(getTrustScoreBand(score))}</p>
        <p><strong>Legal Name:</strong> {profile.legalName}</p>
        <p><strong>Country:</strong> {profile.country}</p>
        <p><strong>Industry:</strong> {profile.industry}</p>
        <p><strong>Website:</strong> {profile.website || "Not provided"}</p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Compliance Summary</h2>
        <p>Required documents: {requiredDocuments.length}</p>
        <p>Uploaded documents: {organization.complianceDocuments.length}</p>
        <p>Approved verification: {verified ? "Yes" : "No"}</p>
      </section>

      <p style={{ marginTop: 24 }}><Link href="/vendors">Back to vendor directory</Link></p>
    </main>
  );
}
