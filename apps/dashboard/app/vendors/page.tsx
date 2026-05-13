import Link from "next/link";
import { prisma } from "../../lib/db";
import { getRequiredDocuments } from "../../lib/compliance/rules";
import { calculateTrustScore, getTrustScoreBand } from "../../lib/trust-score/calculate";

type SearchParams = {
  q?: string;
  country?: string;
  industry?: string;
  minScore?: string;
  verified?: string;
};

function formatBand(band: string) {
  return band
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function VendorsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const q = String(params.q || "").trim();
  const country = String(params.country || "").trim();
  const industry = String(params.industry || "").trim();
  const minScore = Number(params.minScore || 0);
  const verifiedOnly = params.verified === "true";

  const organizations = await prisma.organization.findMany({
    where: {
      companyProfile: {
        is: {
          ...(country ? { country } : {}),
          ...(industry ? { industry } : {}),
          ...(q
            ? {
                OR: [
                  { legalName: { contains: q, mode: "insensitive" } },
                  { tradeName: { contains: q, mode: "insensitive" } }
                ]
              }
            : {})
        }
      }
    },
    include: {
      companyProfile: true,
      complianceDocuments: true,
      verificationRequests: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const vendors = organizations
    .filter((organization) => organization.companyProfile)
    .map((organization) => {
      const profile = organization.companyProfile!;
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

      return {
        id: organization.id,
        name: profile.tradeName || profile.legalName || organization.name,
        legalName: profile.legalName,
        country: profile.country,
        industry: profile.industry,
        score,
        band: getTrustScoreBand(score),
        verified
      };
    })
    .filter((vendor) => vendor.score >= minScore)
    .filter((vendor) => (verifiedOnly ? vendor.verified : true));

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 1100 }}>
      <h1>Vendor Directory</h1>
      <p>Search verified and verification-ready businesses by country, industry, and trust score.</p>

      <form method="get" style={{ display: "grid", gap: 12, marginTop: 24, maxWidth: 720 }}>
        <input name="q" placeholder="Search company name" defaultValue={q} style={{ padding: 12 }} />
        <input name="country" placeholder="Country code, e.g. GH, NG, KE" defaultValue={country} style={{ padding: 12 }} />
        <input name="industry" placeholder="Industry, e.g. Food, Retail" defaultValue={industry} style={{ padding: 12 }} />
        <input name="minScore" type="number" min="0" max="100" placeholder="Minimum trust score" defaultValue={minScore || ""} style={{ padding: 12 }} />

        <label>
          <input name="verified" type="checkbox" value="true" defaultChecked={verifiedOnly} /> Verified only
        </label>

        <button type="submit" style={{ padding: 12 }}>Search vendors</button>
      </form>

      <section style={{ marginTop: 32 }}>
        <h2>Results</h2>

        {vendors.length === 0 ? (
          <p>No vendors match your filters.</p>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {vendors.map((vendor) => (
              <article key={vendor.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 20 }}>
                <h3>{vendor.name}</h3>
                <p><strong>Legal Name:</strong> {vendor.legalName}</p>
                <p><strong>Country:</strong> {vendor.country}</p>
                <p><strong>Industry:</strong> {vendor.industry}</p>
                <p><strong>Trust Score:</strong> {vendor.score}/100</p>
                <p><strong>Band:</strong> {formatBand(vendor.band)}</p>
                <p><strong>Verification:</strong> {vendor.verified ? "TrustLayer Verified" : "Pending"}</p>
                <Link href={`/vendors/${vendor.id}`}>View public profile</Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <p style={{ marginTop: 24 }}><Link href="/">Back to dashboard</Link></p>
    </main>
  );
}
