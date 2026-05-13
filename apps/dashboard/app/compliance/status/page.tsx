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
