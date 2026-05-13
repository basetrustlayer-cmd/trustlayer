#!/usr/bin/env bash
set -euo pipefail

mkdir -p apps/dashboard/app/onboarding/company
mkdir -p apps/dashboard/app/api/company-profile
mkdir -p apps/dashboard/lib

node - <<'NODE'
const fs = require("fs");
const path = "packages/database/prisma/schema.prisma";
let s = fs.readFileSync(path, "utf8");

if (!s.includes("model CompanyProfile")) {
  s += `

model CompanyProfile {
  id             String   @id @default(cuid())
  organizationId String   @unique
  legalName      String
  tradeName      String?
  entityType     String
  taxId          String?
  website        String?
  phone          String?
  addressLine1   String
  addressLine2   String?
  city           String
  state          String
  postalCode     String
  country        String   @default("US")
  industry       String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}
`;
}

if (!s.includes("companyProfile CompanyProfile?")) {
  s = s.replace(
`  memberships         Membership[]
  verificationRequests VerificationRequest[]`,
`  memberships          Membership[]
  verificationRequests  VerificationRequest[]
  companyProfile        CompanyProfile?`
  );
}

fs.writeFileSync(path, s);
NODE

cat > apps/dashboard/app/api/company-profile/route.ts <<'EOF'
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/db";
import { getSessionUser } from "../../../lib/session";

const schema = z.object({
  legalName: z.string().min(2),
  tradeName: z.string().optional(),
  entityType: z.string().min(2),
  taxId: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  addressLine1: z.string().min(2),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(2),
  country: z.string().default("US"),
  industry: z.string().min(2)
});

async function getOrCreateOrganization(userId: string, legalName?: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { organization: true }
  });

  if (membership) return membership.organization;

  const baseName = legalName || "New Organization";
  const slug = `${baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;

  const organization = await prisma.organization.create({
    data: {
      name: baseName,
      slug,
      memberships: {
        create: {
          userId,
          role: "OWNER"
        }
      }
    }
  });

  return organization;
}

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: {
      organization: {
        include: {
          companyProfile: true
        }
      }
    }
  });

  return NextResponse.json({
    companyProfile: membership?.organization.companyProfile ?? null
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid company profile data" }, { status: 400 });
  }

  const organization = await getOrCreateOrganization(user.id, parsed.data.legalName);

  const profile = await prisma.companyProfile.upsert({
    where: {
      organizationId: organization.id
    },
    create: {
      organizationId: organization.id,
      ...parsed.data
    },
    update: parsed.data
  });

  await prisma.organization.update({
    where: { id: organization.id },
    data: { name: parsed.data.legalName }
  });

  return NextResponse.json({ companyProfile: profile });
}
EOF

cat > apps/dashboard/app/onboarding/company/page.tsx <<'EOF'
"use client";

import { useEffect, useState } from "react";

type CompanyProfile = {
  legalName?: string;
  tradeName?: string;
  entityType?: string;
  taxId?: string;
  website?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  industry?: string;
};

export default function CompanyOnboardingPage() {
  const [profile, setProfile] = useState<CompanyProfile>({});
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/company-profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.companyProfile) setProfile(data.companyProfile);
      });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    const formData = new FormData(event.currentTarget);

    const payload = {
      legalName: formData.get("legalName"),
      tradeName: formData.get("tradeName") || undefined,
      entityType: formData.get("entityType"),
      taxId: formData.get("taxId") || undefined,
      website: formData.get("website") || undefined,
      phone: formData.get("phone") || undefined,
      addressLine1: formData.get("addressLine1"),
      addressLine2: formData.get("addressLine2") || undefined,
      city: formData.get("city"),
      state: formData.get("state"),
      postalCode: formData.get("postalCode"),
      country: formData.get("country") || "US",
      industry: formData.get("industry")
    };

    const response = await fetch("/api/company-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setStatus("Could not save company profile.");
      return;
    }

    const data = await response.json();
    setProfile(data.companyProfile);
    setStatus("Company profile saved.");
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 760 }}>
      <h1>Company Onboarding</h1>
      <p>Complete your business profile so TrustLayer can begin verification workflows.</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 24 }}>
        <input name="legalName" placeholder="Legal business name" defaultValue={profile.legalName || ""} required style={{ padding: 12 }} />
        <input name="tradeName" placeholder="Trade name / DBA" defaultValue={profile.tradeName || ""} style={{ padding: 12 }} />
        <input name="entityType" placeholder="Entity type, e.g. LLC, Corporation" defaultValue={profile.entityType || ""} required style={{ padding: 12 }} />
        <input name="taxId" placeholder="Tax ID / EIN" defaultValue={profile.taxId || ""} style={{ padding: 12 }} />
        <input name="industry" placeholder="Industry" defaultValue={profile.industry || ""} required style={{ padding: 12 }} />
        <input name="website" placeholder="Website" defaultValue={profile.website || ""} style={{ padding: 12 }} />
        <input name="phone" placeholder="Phone" defaultValue={profile.phone || ""} style={{ padding: 12 }} />
        <input name="addressLine1" placeholder="Address line 1" defaultValue={profile.addressLine1 || ""} required style={{ padding: 12 }} />
        <input name="addressLine2" placeholder="Address line 2" defaultValue={profile.addressLine2 || ""} style={{ padding: 12 }} />
        <input name="city" placeholder="City" defaultValue={profile.city || ""} required style={{ padding: 12 }} />
        <input name="state" placeholder="State" defaultValue={profile.state || ""} required style={{ padding: 12 }} />
        <input name="postalCode" placeholder="Postal code" defaultValue={profile.postalCode || ""} required style={{ padding: 12 }} />
        <input name="country" placeholder="Country" defaultValue={profile.country || "US"} required style={{ padding: 12 }} />
        <button type="submit" style={{ padding: 12 }}>Save company profile</button>
      </form>

      {status ? <p style={{ marginTop: 16 }}>{status}</p> : null}
      <p style={{ marginTop: 24 }}><a href="/">Back to dashboard</a></p>
    </main>
  );
}
EOF

cat > apps/dashboard/app/page.tsx <<'EOF'
import { redirect } from "next/navigation";
import { getSessionUser } from "../lib/session";
import { prisma } from "../lib/db";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: {
      organization: {
        include: {
          companyProfile: true
        }
      }
    }
  });

  const hasCompanyProfile = Boolean(membership?.organization.companyProfile);

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>TrustLayer Dashboard</h1>
      <p>Vendor verification, compliance status, and trust workflows.</p>

      <section style={{ marginTop: 24, padding: 20, border: "1px solid #ddd", maxWidth: 640 }}>
        <h2>Onboarding Status</h2>
        <p>Company Profile: {hasCompanyProfile ? "Complete" : "Incomplete"}</p>
        <a href="/onboarding/company">
          {hasCompanyProfile ? "Edit company profile" : "Complete company profile"}
        </a>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Signed in</h2>
        <p>Email: {user.email}</p>
        <p>Role: {user.role}</p>
        <form action="/api/auth/logout" method="post">
          <button type="submit" style={{ padding: 12 }}>Log out</button>
        </form>
      </section>
    </main>
  );
}
EOF

echo "Epic 5 vendor registration workflow scaffold complete."
