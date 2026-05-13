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
