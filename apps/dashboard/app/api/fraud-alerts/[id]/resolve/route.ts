import { NextResponse } from "next/server";

const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? "http://localhost:4000";
const API_KEY = process.env.TRUSTLAYER_INTERNAL_API_KEY ?? "";

function gatewayHeaders() {
  return {
    "Content-Type": "application/json",
    ...(API_KEY ? { "x-api-key": API_KEY } : {})
  };
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;

  const response = await fetch(
    `${API_GATEWAY_URL}/v1/fraud-alerts/${params.id}/resolve`,
    {
      method: "POST",
      headers: gatewayHeaders()
    }
  );

  const data = await response.json();

  return NextResponse.json(data, {
    status: response.status
  });
}
