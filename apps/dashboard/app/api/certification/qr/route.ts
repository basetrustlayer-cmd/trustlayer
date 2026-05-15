import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getSessionUser } from "../../../../lib/session";
import { assertBadgeAccessAllowed } from "../../../../lib/billing/limits";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildQrPlaceholderSvg(input: {
  organizationName: string;
  verificationUrl: string;
}) {
  const label = escapeXml(input.organizationName);
  const url = escapeXml(input.verificationUrl);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="420" height="420" viewBox="0 0 420 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="TrustLayer verification QR">
  <rect width="420" height="420" fill="#ffffff"/>
  <rect x="20" y="20" width="380" height="380" fill="#ffffff" stroke="#111111" stroke-width="4"/>
  <rect x="55" y="55" width="90" height="90" fill="#111111"/>
  <rect x="75" y="75" width="50" height="50" fill="#ffffff"/>
  <rect x="275" y="55" width="90" height="90" fill="#111111"/>
  <rect x="295" y="75" width="50" height="50" fill="#ffffff"/>
  <rect x="55" y="275" width="90" height="90" fill="#111111"/>
  <rect x="75" y="295" width="50" height="50" fill="#ffffff"/>
  <rect x="180" y="175" width="28" height="28" fill="#111111"/>
  <rect x="220" y="175" width="28" height="28" fill="#111111"/>
  <rect x="260" y="175" width="28" height="28" fill="#111111"/>
  <rect x="180" y="215" width="28" height="28" fill="#111111"/>
  <rect x="260" y="215" width="28" height="28" fill="#111111"/>
  <rect x="180" y="255" width="28" height="28" fill="#111111"/>
  <rect x="220" y="255" width="28" height="28" fill="#111111"/>
  <rect x="300" y="255" width="28" height="28" fill="#111111"/>
  <rect x="220" y="295" width="28" height="28" fill="#111111"/>
  <rect x="260" y="295" width="28" height="28" fill="#111111"/>
  <text x="210" y="388" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#111111">${label}</text>
  <text x="210" y="405" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#444444">${url}</text>
</svg>`;
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

  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/verify/${platform.slug}`;

  const svg = buildQrPlaceholderSvg({
    organizationName: platform.organization.name,
    verificationUrl
  });

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store"
    }
  });
}
