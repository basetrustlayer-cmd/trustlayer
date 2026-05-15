import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getSessionUser } from "../../../../lib/session";
import { assertBadgeAccessAllowed } from "../../../../lib/billing/limits";

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function getScoreBand(score: number) {
  if (score >= 85) return "High Trust";
  if (score >= 70) return "Good Standing";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Low";
  return "Unscored";
}

function buildCertificatePdf(input: {
  certificateId: string;
  organizationName: string;
  platformName: string;
  score: number;
  band: string;
  verificationTier: string;
  issuedAt: string;
  expiresAt: string;
  verificationUrl: string;
}) {
  const lines = [
    "BT /F1 26 Tf 72 735 Td (TrustLayer Certificate) Tj ET",
    "BT /F1 16 Tf 72 690 Td (Verified Organization) Tj ET",
    `BT /F1 22 Tf 72 650 Td (${escapePdfText(input.organizationName)}) Tj ET`,
    `BT /F1 12 Tf 72 615 Td (Platform: ${escapePdfText(input.platformName)}) Tj ET`,
    `BT /F1 12 Tf 72 590 Td (Certificate ID: ${escapePdfText(input.certificateId)}) Tj ET`,
    `BT /F1 12 Tf 72 565 Td (Trust Score: ${input.score}/100) Tj ET`,
    `BT /F1 12 Tf 72 540 Td (Trust Band: ${escapePdfText(input.band)}) Tj ET`,
    `BT /F1 12 Tf 72 515 Td (Verification Tier: ${escapePdfText(input.verificationTier)}) Tj ET`,
    `BT /F1 12 Tf 72 490 Td (Issued: ${escapePdfText(input.issuedAt)}) Tj ET`,
    `BT /F1 12 Tf 72 465 Td (Expires: ${escapePdfText(input.expiresAt)}) Tj ET`,
    "BT /F1 12 Tf 72 420 Td (This certificate confirms that the organization has met TrustLayer verification requirements.) Tj ET",
    "BT /F1 12 Tf 72 395 Td (Verification URL:) Tj ET",
    `BT /F1 10 Tf 72 375 Td (${escapePdfText(input.verificationUrl)}) Tj ET`,
    "BT /F1 12 Tf 72 320 Td (Authorized by TrustLayer) Tj ET"
  ];

  const stream = lines.join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const platform = await prisma.platform.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { organization: true }
  });

  if (!platform?.organizationId || !platform.organization) {
    return NextResponse.json(
      { error: "No organization is linked to this platform." },
      { status: 403 }
    );
  }

  const access = await assertBadgeAccessAllowed(platform.organizationId);

  if (!access.allowed) {
    return NextResponse.json({ error: access.reason }, { status: 403 });
  }

  const subject = await prisma.subject.findFirst({
    where: { externalId: user.id }
  });

  const score = subject
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

  const currentScore = score?.score ?? 0;

  if (!approvedVerification || currentScore < 70) {
    return NextResponse.json(
      { error: "Certificate is not available until verification is approved and score is at least 70." },
      { status: 403 }
    );
  }

  const issuedAt = new Date();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const certificateId = `TL-${issuedAt.getFullYear()}-${approvedVerification.id.slice(-8).toUpperCase()}`;
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/verify/${platform.slug}`;

  const pdf = buildCertificatePdf({
    certificateId,
    organizationName: platform.organization.name,
    platformName: platform.name,
    score: currentScore,
    band: getScoreBand(currentScore),
    verificationTier: subject?.verificationTier ?? "UNVERIFIED",
    issuedAt: issuedAt.toISOString().slice(0, 10),
    expiresAt: expiresAt.toISOString().slice(0, 10),
    verificationUrl
  });

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${certificateId}.pdf"`
    }
  });
}
