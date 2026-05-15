import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/session";

const MESSAGE =
  "Compliance document uploads are not part of the current TrustLayer MVP.";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    enabled: false,
    documents: [],
    message: MESSAGE
  });
}

export async function POST() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      enabled: false,
      message: MESSAGE
    },
    { status: 410 }
  );
}
