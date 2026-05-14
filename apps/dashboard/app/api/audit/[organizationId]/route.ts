import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";
import { getSessionUser } from "../../../../lib/session";

type Params = {
  params: Promise<{
    organizationId: string;
  }>;
};

export async function GET(_: Request, { params }: Params) {
  const user = await getSessionUser();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { organizationId } = await params;

  const logs = await prisma.auditLog.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          email: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return NextResponse.json({ logs });
}
