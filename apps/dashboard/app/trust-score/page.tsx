"use client";

import { useEffect, useState } from "react";

type TrustScoreResponse = {
  score: number;
  tier: string;
  confidence: number;
  factors: {
    identity: number;
    transactions: number;
    reviews: number;
    disputes: number;
    tenure: number;
  };
  source?: string;
};

function formatLabel(value: string) {
  return value
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
    return (
      <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
        Loading...
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 40,
        fontFamily: "Arial, sans-serif",
        maxWidth: 760
      }}
    >
      <h1>TrustScore</h1>

      <section style={{ marginTop: 24, padding: 24, border: "1px solid #ddd" }}>
        <h2 style={{ fontSize: 48, margin: 0 }}>{data.score}/100</h2>
        <p>Tier: {formatLabel(data.tier)}</p>
        <p>Confidence: {Math.round(data.confidence * 100)}%</p>
        <p>Source: {data.source || "identity_first"}</p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Scoring Factors</h2>
        <p>Identity: {data.factors.identity}</p>
        <p>Transactions: {data.factors.transactions}</p>
        <p>Reviews: {data.factors.reviews}</p>
        <p>Disputes: {data.factors.disputes}</p>
        <p>Tenure: {data.factors.tenure}</p>
      </section>

      <p style={{ marginTop: 24 }}>
        <a href="/">Back to dashboard</a>
      </p>
    </main>
  );
}
