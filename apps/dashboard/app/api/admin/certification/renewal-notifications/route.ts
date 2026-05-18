import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../../lib/session";
import { runRenewalNotificationScan } from "../../../../../lib/certification/renewal-notifications";

export async function POST() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await runRenewalNotificationScan(user.id);

  return NextResponse.json(result);
}
