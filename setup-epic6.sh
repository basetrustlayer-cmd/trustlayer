#!/usr/bin/env bash
set -euo pipefail

mkdir -p apps/dashboard/app/compliance/documents
mkdir -p apps/dashboard/app/api/compliance/documents
mkdir -p apps/dashboard/uploads/compliance

node - <<'NODE'
const fs = require("fs");
const path = "packages/database/prisma/schema.prisma";
let s = fs.readFileSync(path, "utf8");

if (!s.includes("enum ComplianceDocumentType")) {
  s += `

enum ComplianceDocumentType {
  CERTIFICATE_OF_INCORPORATION
  TAX_IDENTIFICATION
  VAT_REGISTRATION
  BUSINESS_OPERATING_PERMIT
  BENEFICIAL_OWNERSHIP
  SOCIAL_SECURITY_REGISTRATION
  IMPORT_EXPORT_LICENSE
  FOOD_DRUG_AUTHORITY_APPROVAL
  ENVIRONMENTAL_PERMIT
  INSURANCE_CERTIFICATE
  BANK_REFERENCE
  BUSINESS_LICENSE
  SAFETY_CERTIFICATE
  OTHER
}

enum ComplianceDocumentStatus {
  DRAFT
  SUBMITTED
  IN_REVIEW
  APPROVED
  REJECTED
  EXPIRED
}

model ComplianceDocument {
  id             String                   @id @default(cuid())
  organizationId String
  type           ComplianceDocumentType
  status         ComplianceDocumentStatus @default(SUBMITTED)
  title          String
  fileName       String
  filePath       String
  mimeType       String
  sizeBytes      Int
  notes          String?
  issuedAt       DateTime?
  expiresAt      DateTime?
  createdAt      DateTime                 @default(now())
  updatedAt      DateTime                 @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}
`;
}

if (!s.includes("complianceDocuments ComplianceDocument[]")) {
  s = s.replace(
`  companyProfile        CompanyProfile?`,
`  companyProfile        CompanyProfile?
  complianceDocuments   ComplianceDocument[]`
  );
}

fs.writeFileSync(path, s);
NODE

cat > apps/dashboard/app/api/compliance/documents/route.ts <<'EOF'
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getSessionUser } from "../../../../lib/session";

async function getUserOrganization(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { organization: true }
  });

  return membership?.organization ?? null;
}

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organization = await getUserOrganization(user.id);

  if (!organization) {
    return NextResponse.json({ documents: [] });
  }

  const documents = await prisma.complianceDocument.findMany({
    where: { organizationId: organization.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organization = await getUserOrganization(user.id);

  if (!organization) {
    return NextResponse.json({ error: "Complete company onboarding first" }, { status: 400 });
  }

  const formData = await request.formData();

  const file = formData.get("file") as File | null;
  const type = String(formData.get("type") || "");
  const title = String(formData.get("title") || "");
  const notes = String(formData.get("notes") || "");

  if (!file || !type || !title) {
    return NextResponse.json({ error: "Missing required document data" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "uploads", "compliance", organization.id);
  await mkdir(uploadDir, { recursive: true });

  const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = path.join(uploadDir, safeFileName);

  await writeFile(filePath, buffer);

  const document = await prisma.complianceDocument.create({
    data: {
      organizationId: organization.id,
      type: type as any,
      title,
      fileName: file.name,
      filePath,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      notes: notes || null
    }
  });

  return NextResponse.json({ document });
}
EOF

cat > apps/dashboard/app/compliance/documents/page.tsx <<'EOF'
"use client";

import { useEffect, useState } from "react";

type ComplianceDocument = {
  id: string;
  title: string;
  type: string;
  status: string;
  fileName: string;
  createdAt: string;
};

const documentTypes = [
  ["CERTIFICATE_OF_INCORPORATION", "Certificate of Incorporation"],
  ["TAX_IDENTIFICATION", "Tax Identification Number / TIN Certificate"],
  ["VAT_REGISTRATION", "VAT Registration Certificate"],
  ["BUSINESS_OPERATING_PERMIT", "Business Operating Permit"],
  ["BENEFICIAL_OWNERSHIP", "Beneficial Ownership Declaration"],
  ["SOCIAL_SECURITY_REGISTRATION", "Social Security / SSNIT / NSSF Registration"],
  ["IMPORT_EXPORT_LICENSE", "Import / Export License"],
  ["FOOD_DRUG_AUTHORITY_APPROVAL", "Food and Drugs Authority / NAFDAC / KEBS Approval"],
  ["ENVIRONMENTAL_PERMIT", "Environmental Permit"],
  ["INSURANCE_CERTIFICATE", "Insurance Certificate"],
  ["BANK_REFERENCE", "Bank Reference Letter"],
  ["BUSINESS_LICENSE", "Business License"],
  ["SAFETY_CERTIFICATE", "Safety / OSHA-style Certificate"],
  ["OTHER", "Other Compliance Document"]
];

export default function ComplianceDocumentsPage() {
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [status, setStatus] = useState("");

  async function loadDocuments() {
    const response = await fetch("/api/compliance/documents");
    const data = await response.json();
    setDocuments(data.documents || []);
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/compliance/documents", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      setStatus("Could not upload document. Make sure company onboarding is complete.");
      return;
    }

    setStatus("Document uploaded successfully.");
    event.currentTarget.reset();
    await loadDocuments();
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 860 }}>
      <h1>Compliance Documents</h1>
      <p>
        Upload African business compliance documents for verification, including incorporation,
        tax, VAT, operating permits, beneficial ownership, insurance, and sector-specific licenses.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 24 }}>
        <input name="title" placeholder="Document title" required style={{ padding: 12 }} />

        <select name="type" required style={{ padding: 12 }}>
          <option value="">Select document type</option>
          {documentTypes.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <textarea name="notes" placeholder="Notes, issuing authority, country, expiry details, etc." style={{ padding: 12 }} />

        <input name="file" type="file" required style={{ padding: 12 }} />

        <button type="submit" style={{ padding: 12 }}>Upload document</button>
      </form>

      {status ? <p style={{ marginTop: 16 }}>{status}</p> : null}

      <section style={{ marginTop: 32 }}>
        <h2>Uploaded Documents</h2>
        {documents.length === 0 ? (
          <p>No documents uploaded yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {documents.map((doc) => (
              <article key={doc.id} style={{ border: "1px solid #ddd", padding: 16 }}>
                <h3>{doc.title}</h3>
                <p>Type: {doc.type}</p>
                <p>Status: {doc.status}</p>
                <p>File: {doc.fileName}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <p style={{ marginTop: 24 }}><a href="/">Back to dashboard</a></p>
    </main>
  );
}
EOF

node - <<'NODE'
const fs = require("fs");
const path = "apps/dashboard/app/page.tsx";
let s = fs.readFileSync(path, "utf8");

if (!s.includes("/compliance/documents")) {
  s = s.replace(
`      <section style={{ marginTop: 24 }}>
        <h2>Signed in</h2>`,
`      <section style={{ marginTop: 24, padding: 20, border: "1px solid #ddd", maxWidth: 640 }}>
        <h2>Compliance Documents</h2>
        <p>Upload incorporation, tax, VAT, permits, insurance, and sector-specific verification documents.</p>
        <a href="/compliance/documents">Manage compliance documents</a>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Signed in</h2>`
  );
}

fs.writeFileSync(path, s);
NODE

echo "Epic 6 compliance document workflow scaffold complete."
