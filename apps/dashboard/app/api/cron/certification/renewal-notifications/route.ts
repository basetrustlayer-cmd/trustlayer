import { NextResponse } from "next/server";
import { runRenewalNotificationScan } from "../../../admin/certification/renewal-notifications/route";

function getCronSecret() {
  const secret = process.env.CRON_SECRET;

  if (!secret || secret.length < 24) {
    throw new Error("CRON_SECRET must be set and at least 24 characters long.");
  }

  return secret;
}

function extractBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

export async function POST(request: Request) {
  const expectedSecret = getCronSecret();
  const providedSecret = extractBearerToken(request);

  if (!providedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
  }

  const result = await runRenewalNotificationScan(null);

  return NextResponse.json({
    triggeredBy: "cron",
    ...result
  });
}
