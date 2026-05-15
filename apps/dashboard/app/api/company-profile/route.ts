import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/db";
import { getSessionUser } from "../../../lib/session";

const schema = z.object({
  name: z.string().min(2),
  website: z.string().url().optional().or(z.literal("")),
  contactEmail: z.string().email(),
  planTier: z
    .enum(["SANDBOX", "STARTER", "GROWTH", "ENTERPRISE"])
    .default("SANDBOX")
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const platform = await prisma.platform.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json({ platform });
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid platform registration data" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const website =
    typeof data.website === "string" && data.website.length > 0
      ? data.website
      : null;

  const existing = await prisma.platform.findFirst({
    where: { userId: user.id }
  });

  const baseSlug = slugify(data.name);

  const platform = existing
    ? await prisma.platform.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          website,
          contactEmail: data.contactEmail,
          planTier: data.planTier
        }
      })
    : await prisma.platform.create({
        data: {
          userId: user.id,
          name: data.name,
          slug: `${baseSlug}-${Date.now()}`,
          website,
          contactEmail: data.contactEmail,
          planTier: data.planTier
        }
      });

  return NextResponse.json({ platform });
}
