import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getSessionUser } from "../../../../lib/session";
import { assertBadgeAccessAllowed } from "../../../../lib/billing/limits";
import { generateVerificationQrSvg } from "../../../../lib/certification/qr";

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

  const svg = await generateVerificationQrSvg(platform.slug);

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store"
    }
  });
}
