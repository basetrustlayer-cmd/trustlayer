"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BadgeData = {
  error?: string;
  eligible: boolean;
  verified: boolean;
  status: string;
  organizationName: string;
  platformName: string;
  platformSlug: string;
  score: number;
  band: string;
  confidence: number;
  verificationTier: string;
  approvedVerification: boolean;
  approvedVerificationId: string | null;
  approvedDocuments: number;
  totalDocuments: number;
  badgeLabel: string;
  issuedAt: string | null;
  expiresAt: string | null;
  renewalDueAt: string | null;
  daysUntilExpiration: number | null;
  verificationUrl: string;
  badgeImageUrl: string;
  embedCode: string;
};

function formatLabel(value: string | null | undefined) {
  if (!value) return "Unknown";

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Not issued";
}

export default function CertificationBadgePage() {
  const [data, setData] = useState<BadgeData | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/certification/badge")
      .then((res) => res.json())
      .then((payload: BadgeData) => {
        if (payload.error) setMessage(payload.error);
        setData(payload);
      })
      .catch(() => setMessage("Unable to load badge data."));
  }, []);

  async function copyEmbedCode() {
    if (!data?.embedCode) return;
    await navigator.clipboard.writeText(data.embedCode);
    setMessage("Embed code copied.");
  }

  if (!data && !message) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
        <div className="mx-auto max-w-7xl animate-pulse rounded-3xl border border-white/10 bg-white/[0.06] p-8">
          Loading Trust Badge Command Center...
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
            Trust Badge Command Center
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Publish portable trust everywhere.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            Manage badge eligibility, public verification, QR trust cards,
            embeddable reputation signals, and printable certification.
          </p>
        </div>

        {message ? (
          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-100">
            {message}
          </div>
        ) : null}

        {data ? (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-4">
              <MetricCard label="Badge Status" value={formatLabel(data.status)} />
              <MetricCard label="TrustScore" value={`${data.score}/100`} />
              <MetricCard label="Confidence" value={`${Math.round(data.confidence * 100)}%`} />
              <MetricCard label="Verification Tier" value={formatLabel(data.verificationTier)} />
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-8">
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-300">
                  {data.badgeLabel}
                </p>
                <h2 className="mt-4 text-3xl font-semibold">{data.organizationName}</h2>
                <p className="mt-2 text-sm text-slate-400">Platform: {data.platformName}</p>

                <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
                  <p className="text-sm text-cyan-100">Public TrustScore</p>
                  <p className="mt-2 text-6xl font-semibold">{data.score}</p>
                  <p className="mt-2 text-sm text-cyan-200">{formatLabel(data.band)}</p>
                </div>

                <div className="mt-6 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                  <p>Issued: {formatDate(data.issuedAt)}</p>
                  <p>Expires: {formatDate(data.expiresAt)}</p>
                  <p>Renewal Due: {formatDate(data.renewalDueAt)}</p>
                  <p>
                    Expiration:{" "}
                    {data.daysUntilExpiration !== null
                      ? `${data.daysUntilExpiration} days`
                      : "Not scheduled"}
                  </p>
                </div>
              </article>

              <aside className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
                <h2 className="text-xl font-semibold">Badge Readiness</h2>

                <div className="mt-5 grid gap-3">
                  <ReadinessItem
                    label="Approved verification"
                    complete={data.approvedVerification}
                  />
                  <ReadinessItem
                    label="Minimum TrustScore"
                    complete={data.score >= 70}
                  />
                  <ReadinessItem
                    label="Approved documents"
                    complete={data.approvedDocuments > 0}
                    detail={`${data.approvedDocuments}/${data.totalDocuments}`}
                  />
                  <ReadinessItem
                    label="Public verification"
                    complete={data.verified}
                  />
                </div>

                {!data.eligible ? (
                  <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
                    Requirements are not yet complete. Finish verification and
                    evidence review before publishing a badge.
                  </div>
                ) : null}
              </aside>
            </section>

            {data.eligible ? (
              <section className="mt-6 grid gap-6 lg:grid-cols-2">
                <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
                  <h2 className="text-xl font-semibold">Embeddable Badge</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Copy this badge into your website, marketplace profile, or partner portal.
                  </p>

                  <img
                    src={data.badgeImageUrl}
                    alt={`TrustLayer verification badge for ${data.organizationName}`}
                    className="mt-5 w-full max-w-md rounded-2xl border border-white/10 bg-white"
                  />

                  <pre className="mt-5 max-h-48 overflow-auto rounded-2xl border border-white/10 bg-slate-950 p-4 text-xs text-slate-300">
                    {data.embedCode}
                  </pre>

                  <button
                    type="button"
                    onClick={copyEmbedCode}
                    className="mt-4 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                  >
                    Copy embed code
                  </button>
                </article>

                <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
                  <h2 className="text-xl font-semibold">QR Verification Card</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Use this QR code on printed certificates, proposals, and offline trust checks.
                  </p>

                  <img
                    src="/api/certification/qr"
                    alt="TrustLayer verification QR code"
                    className="mt-5 h-56 w-56 rounded-2xl border border-white/10 bg-white p-3"
                  />

                  <a
                    href="/api/certification/qr"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    Open QR image
                  </a>
                </article>

                <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 lg:col-span-2">
                  <h2 className="text-xl font-semibold">Printable Certificate</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    This certifies that <strong>{data.organizationName}</strong>{" "}
                    has met TrustLayer verification requirements.
                  </p>

                  <div className="mt-5 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                    <p>Certificate ID: {data.approvedVerificationId || "Pending"}</p>
                    <p>Verification URL: {data.verificationUrl}</p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                    >
                      Print certificate
                    </button>
                    <a
                      href="/api/certification/certificate"
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                    >
                      Download PDF certificate
                    </a>
                  </div>
                </article>
              </section>
            ) : null}

            <section className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/verification/requests"
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                View verification requests
              </Link>
              <Link
                href="/trust-score"
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                View TrustScore
              </Link>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </article>
  );
}

function ReadinessItem({
  label,
  complete,
  detail
}: {
  label: string;
  complete: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <div>
        <p className="text-sm text-slate-300">{label}</p>
        {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
      </div>
      <span
        className={[
          "rounded-full px-3 py-1 text-xs font-medium",
          complete
            ? "bg-emerald-300/10 text-emerald-200"
            : "bg-amber-300/10 text-amber-200"
        ].join(" ")}
      >
        {complete ? "Ready" : "Needed"}
      </span>
    </div>
  );
}
