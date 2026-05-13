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

    const form = event.currentTarget;
    const formData = new FormData(form);

    const response = await fetch("/api/compliance/documents", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      setStatus("Could not upload document. Make sure company onboarding is complete.");
      return;
    }

    setStatus("Document uploaded successfully.");
    form.reset();
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
