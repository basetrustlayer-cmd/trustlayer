import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getSessionUser } from "../../../../lib/session";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const platform = await prisma.platform.findFirst({
    where: {
      userId: user.id
    }
  });

  if (!platform?.organizationId) {
    return NextResponse.json({
      organization: null,
      subscription: null,
      invoices: [],
      payments: []
    });
  }

  const organization = await prisma.organization.findUnique({
    where: {
      id: platform.organizationId
    }
  });

  const subscription = await prisma.subscription.findUnique({
    where: {
      organizationId: platform.organizationId
    },
    include: {
      plan: true
    }
  });

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: platform.organizationId
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 10
  });

  const payments = await prisma.payment.findMany({
    where: {
      organizationId: platform.organizationId
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 10
  });

  return NextResponse.json({
    organization,
    subscription,
    invoices,
    payments
  });
}
