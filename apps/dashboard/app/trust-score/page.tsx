"use client";

import Link from "next/link";
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
  if (!value) return "Unknown";

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function confidenceLabel(confidence: number) {
  if (confidence >= 0.85) return "High confidence";
  if (confidence >= 0.6) return "Moderate confidence";
  return "Low confidence";
}

function explainScore(data: TrustScoreResponse) {
  const strongestFactor = Object.entries(data.factors).sort(
    ([, a], [, b]) => b - a
  )[0];

  return `This ${formatLabel(data.tier)} TrustScore is primarily driven by ${formatLabel(
    strongestFactor?.[0]
  )}, a ${formatLabel(data.verificationTier)} verification tier, and ${
    Math.round(data.confidence * 100)
  }% confidence. The current score ceiling is ${data.tierCeiling}/100.`;
}

export default function TrustScorePage() {
  const [data, setData] = useState<TrustScoreResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/trust-score")
      .then((res) => res.json())
      .then((payload: TrustScoreResponse) => {
        if (payload.error) setError(payload.error);
        setData(payload);
      })
      .catch(() => setError("Unable to load TrustScore data."));
  }, []);

  const latestHistory = useMemo(() => {
    return [...(data?.history ?? [])].reverse();
  }, [data?.history]);

  if (!data && !error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
        <div className="mx-auto max-w-7xl animate-pulse rounded-3xl border border-white/10 bg-white/[0.06] p-8">
          Loading TrustScore intelligence...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm font-medium text-cyan-200 hover:text-cyan-100">
          ← Back to Trust Center
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            TrustScore Intelligence
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Explainable reputation and risk scoring.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            Understand score composition, confidence, verification ceilings,
            leaderboard position, and historical movement in one operational view.
          </p>
        </div>

        {error ? (
          <section className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            {error}
          </section>
        ) : null}

        {data ? (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-3">
              <MetricCard label="Current Score" value={`${data.score}/100`} detail={formatLabel(data.tier)} />
              <MetricCard label="Confidence" value={`${Math.round(data.confidence * 100)}%`} detail={confidenceLabel(data.confidence)} />
              <MetricCard label="Leaderboard" value={data.rank ? `#${data.rank}` : "Unranked"} detail={formatLabel(data.role)} />
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
                <h2 className="text-xl font-semibold">Factor Breakdown</h2>
                <div className="mt-6 space-y-5">
                  {Object.entries(data.factors).map(([key, value]) => (
                    <div key={key}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-slate-300">{formatLabel(key)}</span>
                        <span className="font-medium text-white">{value}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-cyan-300"
                          style={{ width: `${clampPercent(value)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
                <h2 className="text-xl font-semibold text-cyan-100">Explain This Score</h2>
                <p className="mt-4 text-sm leading-6 text-cyan-50">
                  {explainScore(data)}
                </p>
                <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                  <p>Verification Tier: {formatLabel(data.verificationTier)}</p>
                  <p>Tier Ceiling: {data.tierCeiling}/100</p>
                  <p>Source: {data.source || "persisted_trust_score"}</p>
                </div>
              </aside>
            </section>

            <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
              <h2 className="text-xl font-semibold">Score History</h2>
              {latestHistory.length ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="text-left text-slate-400">
                      <tr>
                        <th className="border-b border-white/10 py-3">Date</th>
                        <th className="border-b border-white/10 py-3">Score</th>
                        <th className="border-b border-white/10 py-3">Confidence</th>
                        <th className="border-b border-white/10 py-3">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestHistory.map((entry) => (
                        <tr key={entry.id} className="text-slate-200">
                          <td className="border-b border-white/10 py-3">{formatDate(entry.createdAt)}</td>
                          <td className="border-b border-white/10 py-3">{entry.score}</td>
                          <td className="border-b border-white/10 py-3">{Math.round(entry.confidence * 100)}%</td>
                          <td className="border-b border-white/10 py-3">{entry.reason || "score.updated"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-400">No score history yet.</p>
              )}
            </section>

            <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
              <h2 className="text-xl font-semibold">Top TrustLayer Scores</h2>
              {data.leaderboard.length ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="text-left text-slate-400">
                      <tr>
                        <th className="border-b border-white/10 py-3">Rank</th>
                        <th className="border-b border-white/10 py-3">Subject</th>
                        <th className="border-b border-white/10 py-3">Type</th>
                        <th className="border-b border-white/10 py-3">Tier</th>
                        <th className="border-b border-white/10 py-3">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.leaderboard.map((entry) => (
                        <tr key={`${entry.rank}-${entry.subjectId}`} className="text-slate-200">
                          <td className="border-b border-white/10 py-3">#{entry.rank}</td>
                          <td className="border-b border-white/10 py-3">{entry.externalId}</td>
                          <td className="border-b border-white/10 py-3">{formatLabel(entry.subjectType)}</td>
                          <td className="border-b border-white/10 py-3">{formatLabel(entry.verificationTier)}</td>
                          <td className="border-b border-white/10 py-3">{entry.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-400">No leaderboard data yet.</p>
              )}
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-4xl font-semibold tracking-tight">{value}</p>
      <p className="mt-3 text-sm text-cyan-200">{detail}</p>
    </article>
  );
}
