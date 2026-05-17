import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getSessionUser } from "../../../../lib/session";

function getApiGatewayUrl() {
  return process.env.API_GATEWAY_URL || "http://localhost:3000";
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const platform = await prisma.platform.findFirst({
    where: { userId: user.id }
  });

  if (!platform?.organizationId) {
    return NextResponse.json(
      { error: "No organization found for user" },
      { status: 403 }
    );
  }

  const body = await request.json();

  const response = await fetch(`${getApiGatewayUrl()}/v1/billing/stripe/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...body,
      organizationId: platform.organizationId
    })
  });

  const data = await response.json();

  return NextResponse.json(data, {
    status: response.status
  });
}
