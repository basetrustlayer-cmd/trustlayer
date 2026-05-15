import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/session";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    enabled: false,
    status: "PARKED",
    completionPercentage: 0,
    requiredDocuments: [],
    missingDocuments: [],
    uploadedDocuments: [],
    message:
      "Compliance tracking is outside the current TrustLayer MVP."
  });
}
