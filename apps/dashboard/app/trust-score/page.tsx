"use client";

import { useEffect, useMemo, useState } from "react";

type ScoreHistoryItem = {
  id: string;
  score: number;
  confidence: number;
  tierCeiling: number;
  reason: string | null;
  createdAt: string;
};

type LeaderboardItem = {
  rank: number;
  subjectId: string;
  externalId: string;
  subjectType: string;
  verificationTier: string;
  score: number;
  confidence: number;
  updatedAt: string;
};

type TrustScoreResponse = {
  error?: string;
  subjectId: string | null;
  role: string;
  score: number;
  tier: string;
  tierCeiling: number;
  confidence: number;
  verificationTier: string;
  rank?: number | null;
  factors: {
    identity: number;
    transactions: number;
    reviews: number;
    disputes: number;
    roleSpecific: number;
  };
  history: ScoreHistoryItem[];
  leaderboard: LeaderboardItem[];
  source?: string;
};

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function factorWidth(value: number) {
  return `${Math.max(0, Math.min(100, value))}%`;
}

export default function TrustScorePage() {
  const [data, setData] = useState<TrustScoreResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/trust-score")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.error) {
          setError(payload.error);
        }

        setData(payload);
      })
      .catch(() => {
        setError("Unable to load TrustScore data.");
      });
  }, []);

  const latestHistory = useMemo(() => {
    return [...(data?.history ?? [])].reverse();
  }, [data?.history]);

  if (!data && !error) {
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
        maxWidth: 1040
      }}
    >
      <p>
        <a href="/">Back to dashboard</a>
      </p>

      <h1>TrustScore Dashboard</h1>
      <p>
        Persistent scoring, marketplace behavior factors, score history, and
        leaderboard position.
      </p>

      {error ? (
        <section
          style={{
            marginTop: 24,
            padding: 16,
            border: "1px solid #cc0000",
            color: "#cc0000"
          }}
        >
          {error}
        </section>
      ) : null}

      {data ? (
        <>
          <section
            style={{
              marginTop: 24,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16
            }}
          >
            <article style={{ padding: 20, border: "1px solid #ddd" }}>
              <h2 style={{ marginTop: 0 }}>Current Score</h2>
              <p style={{ fontSize: 52, fontWeight: "bold", margin: 0 }}>
                {data.score}/100
              </p>
              <p>Band: {formatLabel(data.tier)}</p>
            </article>

            <article style={{ padding: 20, border: "1px solid #ddd" }}>
              <h2 style={{ marginTop: 0 }}>Verification</h2>
              <p>Tier: {formatLabel(data.verificationTier)}</p>
              <p>Ceiling: {data.tierCeiling}/100</p>
              <p>Confidence: {Math.round(data.confidence * 100)}%</p>
            </article>

            <article style={{ padding: 20, border: "1px solid #ddd" }}>
              <h2 style={{ marginTop: 0 }}>Leaderboard</h2>
              <p>Current Rank: {data.rank ? `#${data.rank}` : "Not ranked"}</p>
              <p>Role: {formatLabel(data.role)}</p>
              <p>Source: {data.source || "persisted_trust_score"}</p>
            </article>
          </section>

          <section style={{ marginTop: 32 }}>
            <h2>Factor Breakdown</h2>

            {Object.entries(data.factors).map(([key, value]) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <p style={{ marginBottom: 6 }}>
                  {formatLabel(key)}: {value}
                </p>
                <div
                  style={{
                    height: 12,
                    border: "1px solid #ddd",
                    width: "100%",
                    maxWidth: 720
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: factorWidth(value),
                      background: "#222"
                    }}
                  />
                </div>
              </div>
            ))}
          </section>

          <section style={{ marginTop: 32 }}>
            <h2>Score History</h2>

            {latestHistory.length ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                      Date
                    </th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                      Score
                    </th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                      Confidence
                    </th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {latestHistory.map((entry) => (
                    <tr key={entry.id}>
                      <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                        {formatDate(entry.createdAt)}
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                        {entry.score}
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                        {Math.round(entry.confidence * 100)}%
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                        {entry.reason || "score.updated"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No score history yet.</p>
            )}
          </section>

          <section style={{ marginTop: 32 }}>
            <h2>Top TrustLayer Scores</h2>

            {data.leaderboard.length ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                      Rank
                    </th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                      Subject
                    </th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                      Type
                    </th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                      Tier
                    </th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.leaderboard.map((entry) => (
                    <tr key={`${entry.rank}-${entry.subjectId}`}>
                      <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                        #{entry.rank}
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                        {entry.externalId}
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                        {formatLabel(entry.subjectType)}
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                        {formatLabel(entry.verificationTier)}
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                        {entry.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No leaderboard data yet.</p>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
