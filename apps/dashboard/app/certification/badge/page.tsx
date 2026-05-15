"use client";

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

export default function CertificationBadgePage() {
  const [data, setData] = useState<BadgeData | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/certification/badge")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.error) {
          setMessage(payload.error);
        }

        setData(payload);
      });
  }, []);

  async function copyEmbedCode() {
    if (!data?.embedCode) return;

    await navigator.clipboard.writeText(data.embedCode);
    setMessage("Embed code copied.");
  }

  if (!data && !message) {
    return (
      <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
        Loading...
      </main>
    );
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 960 }}>
      <p>
        <a href="/">Back to dashboard</a>
      </p>

      <h1>TrustLayer Badge & Certificate</h1>
      <p>
        Generate a TrustLayer badge and printable certificate after approval and
        sufficient trust score.
      </p>

      {message ? <p style={{ marginTop: 16 }}>{message}</p> : null}

      {data ? (
        <>
          <section
            style={{
              marginTop: 24,
              padding: 28,
              border: "2px solid #111",
              borderRadius: 12,
              maxWidth: 620
            }}
          >
            <p style={{ textTransform: "uppercase", letterSpacing: 2, margin: 0 }}>
              {data.badgeLabel}
            </p>
            <h2 style={{ fontSize: 34, marginBottom: 8 }}>
              {data.organizationName}
            </h2>
            <p>Platform: {data.platformName}</p>
            <p>Trust Score: {data.score}/100</p>
            <p>Band: {formatLabel(data.band)}</p>
            <p>Verification Tier: {formatLabel(data.verificationTier)}</p>
            <p>Confidence: {Math.round(data.confidence * 100)}%</p>
            <p>Status: {formatLabel(data.status)}</p>
            {data.daysUntilExpiration !== null ? (
              <p>Days Until Expiration: {data.daysUntilExpiration}</p>
            ) : null}
            {data.issuedAt ? (
              <p>Issued: {new Date(data.issuedAt).toLocaleDateString()}</p>
            ) : null}
            {data.expiresAt ? (
              <p>Expires: {new Date(data.expiresAt).toLocaleDateString()}</p>
            ) : null}
            {data.renewalDueAt ? (
              <p>Renewal Due: {new Date(data.renewalDueAt).toLocaleDateString()}</p>
            ) : null}
          </section>

          {!data.eligible ? (
            <section style={{ marginTop: 24, padding: 20, border: "1px solid #ddd" }}>
              <h2>Requirements Not Yet Complete</h2>
              <p>
                Approved Verification: {data.approvedVerification ? "Yes" : "No"}
              </p>
              <p>Minimum Trust Score: 70</p>
              <p>
                Approved Documents: {data.approvedDocuments}/{data.totalDocuments}
              </p>
            </section>
          ) : (
            <>
              <section style={{ marginTop: 24, padding: 20, border: "1px solid #ddd" }}>
                <h2>Embeddable Badge</h2>
                <p>Copy this badge link into your website or marketplace profile.</p>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    padding: 12,
                    border: "1px solid #ddd"
                  }}
                >
                  {data.embedCode}
                </pre>
                <button type="button" onClick={copyEmbedCode} style={{ padding: 10 }}>
                  Copy embed code
                </button>
              </section>

              <section style={{ marginTop: 24, padding: 20, border: "1px solid #ddd" }}>
                <h2>Verification QR Code</h2>
                <p>Use this QR card on printed certificates, proposals, and marketplace profiles.</p>
                <img
                  src="/api/certification/qr"
                  alt="TrustLayer verification QR code"
                  style={{ width: 220, height: 220, border: "1px solid #ddd" }}
                />
                <p>
                  <a href="/api/certification/qr" target="_blank" rel="noreferrer">
                    Open QR image
                  </a>
                </p>
              </section>

              <section style={{ marginTop: 24, padding: 20, border: "1px solid #ddd" }}>
                <h2>Printable Certificate</h2>
                <p>
                  This certifies that <strong>{data.organizationName}</strong> has
                  met TrustLayer verification requirements.
                </p>
                <p>Certificate ID: {data.approvedVerificationId}</p>
                <p>Verification URL: {data.verificationUrl}</p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => window.print()} style={{ padding: 10 }}>
                    Print certificate
                  </button>
                  <a href="/api/certification/certificate" style={{ padding: 10, border: "1px solid #111" }}>
                    Download PDF certificate
                  </a>
                </div>
              </section>
            </>
          )}

          <p style={{ marginTop: 24 }}>
            <a href="/verification/requests">View verification requests</a>
          </p>
          <p>
            <a href="/trust-score">View trust score</a>
          </p>
        </>
      ) : null}
    </main>
  );
}
