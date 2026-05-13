#!/usr/bin/env bash
set -euo pipefail

mkdir -p apps/dashboard/app/trust-score
mkdir -p apps/dashboard/app/api/trust-score
mkdir -p apps/dashboard/lib/trust-score

cat > apps/dashboard/lib/trust-score/calculate.ts <<'EOF'
type DocumentInput = {
  type: string;
  status: string;
  expiresAt?: string | Date | null;
};

type TrustScoreInput = {
  requiredDocuments: string[];
  uploadedDocuments: DocumentInput[];
  companyProfileComplete: boolean;
};

export function calculateTrustScore(input: TrustScoreInput) {
  let score = 0;

  if (input.companyProfileComplete) {
    score += 20;
  }

  const uploadedTypes = new Set(input.uploadedDocuments.map((doc) => String(doc.type)));
  const requiredCount = input.requiredDocuments.length || 1;
  const completedRequiredCount = input.requiredDocuments.filter((type) => uploadedTypes.has(type)).length;

  score += Math.round((completedRequiredCount / requiredCount) * 40);

  const approvedCount = input.uploadedDocuments.filter((doc) => doc.status === "APPROVED").length;
  const submittedOrReviewCount = input.uploadedDocuments.filter((doc) =>
    ["SUBMITTED", "IN_REVIEW"].includes(doc.status)
  ).length;

  score += Math.min(20, approvedCount * 5 + submittedOrReviewCount * 2);

  const expiredCount = input.uploadedDocuments.filter((doc) => {
    if (!doc.expiresAt) return false;
    return new Date(doc.expiresAt).getTime() < Date.now();
  }).length;

  score -= expiredCount * 10;

  const missingCount = input.requiredDocuments.filter((type) => !uploadedTypes.has(type)).length;
  score -= missingCount * 5;

  return Math.max(0, Math.min(100, score));
}

export function getTrustScoreBand(score: number) {
  if (score >= 85) return "HIGH_TRUST";
  if (score >= 65) return "VERIFICATION_READY";
  if (score >= 40) return "IN_PROGRESS";
  return "LOW_TRUST";
}
EOF

cat > apps/dashboard/app/api/trust-score/route.ts <<'EOF'
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { getSessionUser } from "../../../lib/session";
import { getRequiredDocuments } from "../../../lib/compliance/rules";
import { calculateTrustScore, getTrustScoreBand } from "../../../lib/trust-score/calculate";

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
  const requiredDocuments = profile
    ? getRequiredDocuments(profile.country, profile.industry)
    : [];

  const score = calculateTrustScore({
    companyProfileComplete: Boolean(profile),
    requiredDocuments,
    uploadedDocuments: membership.organization.complianceDocuments.map((doc) => ({
      type: String(doc.type),
      status: String(doc.status),
      expiresAt: doc.expiresAt
    }))
  });

  return NextResponse.json({
    score,
    band: getTrustScoreBand(score),
    companyProfileComplete: Boolean(profile),
    requiredDocuments,
    uploadedDocumentCount: membership.organization.complianceDocuments.length
  });
}
EOF

cat > apps/dashboard/app/trust-score/page.tsx <<'EOF'
"use client";

import { useEffect, useState } from "react";

type TrustScoreResponse = {
  score: number;
  band: string;
  companyProfileComplete: boolean;
  requiredDocuments: string[];
  uploadedDocumentCount: number;
};

function formatBand(band: string) {
  return band
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function TrustScorePage() {
  const [data, setData] = useState<TrustScoreResponse | null>(null);

  useEffect(() => {
    fetch("/api/trust-score")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) {
    return <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>Loading...</main>;
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 760 }}>
      <h1>Trust Score</h1>
      <section style={{ marginTop: 24, padding: 24, border: "1px solid #ddd" }}>
        <h2 style={{ fontSize: 48, margin: 0 }}>{data.score}/100</h2>
        <p>Status: {formatBand(data.band)}</p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Score Inputs</h2>
        <p>Company Profile Complete: {data.companyProfileComplete ? "Yes" : "No"}</p>
        <p>Required Documents: {data.requiredDocuments.length}</p>
        <p>Uploaded Documents: {data.uploadedDocumentCount}</p>
      </section>

      <p style={{ marginTop: 24 }}>
        <a href="/compliance/status">View compliance status</a>
      </p>
      <p>
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

if (!s.includes("/trust-score")) {
  s = s.replace(
`        <a href="/compliance/status">View compliance status</a>`,
`        <a href="/compliance/status">View compliance status</a>
        <br />
        <a href="/trust-score">View trust score</a>`
  );
}

fs.writeFileSync(path, s);
NODE

echo "Epic 8 trust score engine scaffold complete."
