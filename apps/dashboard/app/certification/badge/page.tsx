"use client";

import { useEffect, useState } from "react";

type BadgeData = {
  eligible: boolean;
  organizationName: string;
  legalName: string;
  country: string | null;
  industry: string | null;
  score: number;
  band: string;
  approvedVerification: boolean;
  badgeLabel: string;
  issuedAt: string | null;
};

function formatBand(band: string) {
  return band
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function CertificationBadgePage() {
  const [data, setData] = useState<BadgeData | null>(null);

  useEffect(() => {
    fetch("/api/certification/badge")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) {
    return <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>Loading...</main>;
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 860 }}>
      <h1>Certification Badge</h1>
      <p>
        Generate a TrustLayer verification badge after admin approval and sufficient trust score.
      </p>

      <section
        style={{
          marginTop: 24,
          padding: 28,
          border: "2px solid #111",
          borderRadius: 12,
          maxWidth: 520
        }}
      >
        <p style={{ textTransform: "uppercase", letterSpacing: 2, margin: 0 }}>
          {data.badgeLabel}
        </p>
        <h2 style={{ fontSize: 34, marginBottom: 8 }}>{data.legalName}</h2>
        <p>Trust Score: {data.score}/100</p>
        <p>Band: {formatBand(data.band)}</p>
        <p>Country: {data.country || "Not provided"}</p>
        <p>Industry: {data.industry || "Not provided"}</p>
        <p>Status: {data.eligible ? "Verified" : "Pending verification"}</p>
        {data.issuedAt ? <p>Issued: {new Date(data.issuedAt).toLocaleDateString()}</p> : null}
      </section>

      {!data.eligible ? (
        <section style={{ marginTop: 24, padding: 20, border: "1px solid #ddd" }}>
          <h2>Requirements Not Yet Complete</h2>
          <p>Approved Verification: {data.approvedVerification ? "Yes" : "No"}</p>
          <p>Minimum Trust Score: 70</p>
        </section>
      ) : null}

      <p style={{ marginTop: 24 }}>
        <a href="/verification/requests">View verification requests</a>
      </p>
      <p>
        <a href="/trust-score">View trust score</a>
      </p>
      <p>
        <a href="/">Back to dashboard</a>
      </p>
    </main>
  );
}
