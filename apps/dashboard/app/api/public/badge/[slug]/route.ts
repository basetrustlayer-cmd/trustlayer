import { prisma } from "../../../../../lib/db";
import { getCredentialLifecycle } from "../../../../../lib/certification/lifecycle";

function getScoreBand(score: number): string {
  if (score >= 85) return "HIGH TRUST";
  if (score >= 70) return "GOOD STANDING";
  if (score >= 50) return "FAIR";
  if (score >= 30) return "LOW";
  return "UNSCORED";
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getBadgeColor(verified: boolean, score: number): string {
  if (!verified) return "#6b7280"; // gray

  if (score >= 85) return "#15803d"; // dark green
  if (score >= 70) return "#16a34a"; // green
  if (score >= 50) return "#ca8a04"; // yellow
  return "#dc2626"; // red
}

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const platform = await prisma.platform.findUnique({
    where: { slug: params.slug },
    include: { organization: true }
  });

  if (!platform?.organizationId || !platform.organization) {
    return new Response("Badge not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain"
      }
    });
  }

  const subject = await prisma.subject.findFirst({
    where: {
      externalId: platform.userId
    }
  });

  const trustScore = subject
    ? await prisma.trustScore.findUnique({
        where: {
          subjectId_role: {
            subjectId: subject.id,
            role: "platform"
          }
        }
      })
    : null;

  const approvedVerification = await prisma.verificationRequest.findFirst({
    where: {
      organizationId: platform.organizationId,
      status: "APPROVED"
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  const score = trustScore?.score ?? 0;

  const lifecycle = getCredentialLifecycle({
    verificationTier: subject?.verificationTier ?? "UNVERIFIED",
    approvedVerificationUpdatedAt:
      approvedVerification?.updatedAt ?? null,
    score
  });

  const verified = lifecycle.verified;
  const color = getBadgeColor(verified, score);
  const organizationName = escapeXml(platform.organization.name);
  const statusText = verified
    ? `Verified • ${score}/100`
    : "Verification Pending";

  const band = getScoreBand(score);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="120" role="img" aria-label="TrustLayer Badge">
  <rect width="420" height="120" rx="14" fill="white" stroke="${color}" stroke-width="4"/>
  <rect x="16" y="16" width="88" height="88" rx="12" fill="${color}"/>
  <text x="60" y="68"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="16"
        font-weight="700"
        fill="white">
    TRUST
  </text>
  <text x="120" y="42"
        font-family="Arial, sans-serif"
        font-size="22"
        font-weight="700"
        fill="#111827">
    TrustLayer
  </text>
  <text x="120" y="68"
        font-family="Arial, sans-serif"
        font-size="16"
        fill="#374151">
    ${organizationName}
  </text>
  <text x="120" y="92"
        font-family="Arial, sans-serif"
        font-size="14"
        fill="${color}"
        font-weight="700">
    ${escapeXml(statusText)}
  </text>
  <text x="380" y="110"
        text-anchor="end"
        font-family="Arial, sans-serif"
        font-size="10"
        fill="#9ca3af">
    ${escapeXml(band)}
  </text>
</svg>`.trim();

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300"
    }
  });
}
