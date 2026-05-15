import { NextResponse } from "next/server";

function getApiGatewayUrl() {
  return process.env.API_GATEWAY_URL || "http://localhost:3000";
}

export async function POST(request: Request) {
  const body = await request.json();

  const response = await fetch(`${getApiGatewayUrl()}/v1/billing/stripe/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  return NextResponse.json(data, {
    status: response.status
  });
}
