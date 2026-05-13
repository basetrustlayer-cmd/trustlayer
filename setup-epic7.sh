#!/usr/bin/env bash
set -euo pipefail

mkdir -p apps/dashboard/app/compliance/status
mkdir -p apps/dashboard/app/api/compliance/status
mkdir -p apps/dashboard/lib/compliance

cat > apps/dashboard/lib/compliance/rules.ts <<'EOF'
export type ComplianceRule = {
  country: string;
  industry: string;
  requiredDocuments: string[];
};

export const complianceRules: ComplianceRule[] = [
  {
    country: "GH",
    industry: "Retail",
    requiredDocuments: [
      "CERTIFICATE_OF_INCORPORATION",
      "TAX_IDENTIFICATION",
      "BUSINESS_OPERATING_PERMIT",
      "VAT_REGISTRATION"
    ]
  },
  {
    country: "GH",
    industry: "Food",
    requiredDocuments: [
      "CERTIFICATE_OF_INCORPORATION",
      "TAX_IDENTIFICATION",
      "FOOD_DRUG_AUTHORITY_APPROVAL",
      "BUSINESS_OPERATING_PERMIT"
    ]
  },
  {
    country: "NG",
    industry: "Food",
    requiredDocuments: [
      "CERTIFICATE_OF_INCORPORATION",
      "TAX_IDENTIFICATION",
      "FOOD_DRUG_AUTHORITY_APPROVAL",
      "IMPORT_EXPORT_LICENSE"
    ]
  },
  {
    country: "KE",
    industry: "Manufacturing",
    requiredDocuments: [
      "CERTIFICATE_OF_INCORPORATION",
      "TAX_IDENTIFICATION",
      "SOCIAL_SECURITY_REGISTRATION",
      "ENVIRONMENTAL_PERMIT"
    ]
  }
];

export function getRequiredDocuments(country: string, industry: string) {
  const exact = complianceRules.find(
    (rule) =>
      rule.country.toLowerCase() === country.toLowerCase() &&
      rule.industry.toLowerCase() === industry.toLowerCase()
  );

  if (exact) return exact.requiredDocuments;

  return [
    "CERTIFICATE_OF_INCORPORATION",
    "TAX_IDENTIFICATION",
    "BUSINESS_OPERATING_PERMIT"
  ];
}
EOF

cat > apps/dashboard/app/api/compliance/status/route.ts <<'EOF'
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getSessionUser } from "../../../../lib/session";
import { getRequiredDocuments } from "../../../../lib/compliance/rules";

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
          companyProfile: true,
          complianceDocuments: true
        }
      }
    }
  });

  if (!membership?.organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const profile = membership.organization.companyProfile;

  if (!profile) {
    return NextResponse.json({
      completionPercentage: 0,
      status: "COMPANY_PROFILE_REQUIRED",
      requiredDocuments: [],
      uploadedDocuments: [],
      missingDocuments: []
    });
  }

  const requiredDocuments = getRequiredDocuments(profile.country, profile.industry);
  const uploadedTypes = new Set(
    membership.organization.complianceDocuments.map((doc) => doc.type)
  );

  const missingDocuments = requiredDocuments.filter((type) => !uploadedTypes.has(type));

  const approvedOrSubmitted = membership.organization.complianceDocuments.filter((doc) =>
    requiredDocuments.includes(doc.type)
  );

  const completionPercentage =
    requiredDocuments.length === 0
      ? 100
      : Math.round((approvedOrSubmitted.length / requiredDocuments.length) * 100);

  const expiredDocuments = membership.organization.complianceDocuments.filter((doc) => {
    if (!doc.expiresAt) return false;
    return new Date(doc.expiresAt).getTime() < Date.now();
  });

  return NextResponse.json({
    country: profile.country,
    industry: profile.industry,
    completionPercentage,
    status:
      missingDocuments.length === 0 && expiredDocuments.length === 0
        ? "COMPLIANT"
        : "ACTION_REQUIRED",
    requiredDocuments,
    uploadedDocuments: membership.organization.complianceDocuments,
    missingDocuments,
    expiredDocuments
  });
}
EOF

cat > apps/dashboard/app/compliance/status/page.tsx <<'EOF'
"use client";

import { useEffect, useState } from "react";

type ComplianceStatus = {
  country?: string;
  industry?: string;
  completionPercentage: number;
  status: string;
  requiredDocuments: string[];
  missingDocuments: string[];
  expiredDocuments?: { id: string; title: string; type: string }[];
};

function formatDocType(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ComplianceStatusPage() {
  const [data, setData] = useState<ComplianceStatus | null>(null);

  useEffect(() => {
    fetch("/api/compliance/status")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) {
    return <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>Loading...</main>;
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 860 }}>
      <h1>Compliance Status</h1>
      <p>Country: {data.country || "Not set"}</p>
      <p>Industry: {data.industry || "Not set"}</p>

      <section style={{ marginTop: 24, padding: 20, border: "1px solid #ddd" }}>
        <h2>{data.completionPercentage}% Complete</h2>
        <p>Status: {data.status}</p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Required Documents</h2>
        <ul>
          {data.requiredDocuments.map((doc) => (
            <li key={doc}>{formatDocType(doc)}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Missing Documents</h2>
        {data.missingDocuments.length === 0 ? (
          <p>No missing required documents.</p>
        ) : (
          <ul>
            {data.missingDocuments.map((doc) => (
              <li key={doc}>{formatDocType(doc)}</li>
            ))}
          </ul>
        )}
      </section>

      <p style={{ marginTop: 24 }}>
        <a href="/compliance/documents">Upload documents</a>
      </p>
      <p>
        <a href="/">Back to dashboard</a>
      </p>
    </main>
  );
}
EOF

node - <<'NODE'
const fs = require("fs");
const path = "apps/dashboard/app/page.tsx";
let s = fs.readFileSync(path, "utf8");

if (!s.includes("/compliance/status")) {
  s = s.replace(
`        <a href="/compliance/documents">Manage compliance documents</a>`,
`        <a href="/compliance/documents">Manage compliance documents</a>
        <br />
        <a href="/compliance/status">View compliance status</a>`
  );
}

fs.writeFileSync(path, s);
NODE

echo "Epic 7 verification rules engine scaffold complete."
