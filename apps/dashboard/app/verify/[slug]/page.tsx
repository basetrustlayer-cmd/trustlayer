"use client";

import { useEffect, useState } from "react";

type PublicVerification = {
  error?: string;
  verified: boolean;
  status: string;
  organizationName: string;
  platformName: string;
  platformSlug: string;
  score: number;
  band: string;
  confidence: number;
  verificationTier: string;
  certificateId: string | null;
  approvedVerificationId: string | null;
  approvedDocuments: number;
  totalDocuments: number;
  issuedAt: string | null;
  expiresAt: string | null;
};

function formatLabel(value: string | null | undefined) {
  if (!value) return "Unknown";

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function PublicVerificationPage({
  params
}: {
  params: { slug: string };
}) {
  const [data, setData] = useState<PublicVerification | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/public/verify/${params.slug}`)
      .then((response) => response.json())
      .then((payload) => {
        if (payload.error) {
          setMessage(payload.error);
        }

        setData(payload);
      });
  }, [params.slug]);

  if (!data && !message) {
    return (
      <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
        Loading verification profile...
      </main>
    );
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 960 }}>
      <h1>TrustLayer Public Verification</h1>

      {message ? <p style={{ marginTop: 16 }}>{message}</p> : null}

      {data && !data.error ? (
        <>
          <section
            style={{
              marginTop: 24,
              padding: 28,
              border: "2px solid #111",
              borderRadius: 12,
              maxWidth: 680
            }}
          >
            <p style={{ textTransform: "uppercase", letterSpacing: 2, margin: 0 }}>
              {data.verified ? "TrustLayer Verified" : "Verification Not Active"}
            </p>

            <h2 style={{ fontSize: 34, marginBottom: 8 }}>
              {data.organizationName}
            </h2>

            <p>Platform: {data.platformName}</p>
            <p>Status: {formatLabel(data.status)}</p>
            <p>Trust Score: {data.score}/100</p>
            <p>Band: {formatLabel(data.band)}</p>
            <p>Verification Tier: {formatLabel(data.verificationTier)}</p>
            <p>Confidence: {Math.round(data.confidence * 100)}%</p>
            <p>
              Approved Documents: {data.approvedDocuments}/{data.totalDocuments}
            </p>

            {data.certificateId ? <p>Certificate ID: {data.certificateId}</p> : null}
            {data.issuedAt ? (
              <p>Issued: {new Date(data.issuedAt).toLocaleDateString()}</p>
            ) : null}
            {data.expiresAt ? (
              <p>Expires: {new Date(data.expiresAt).toLocaleDateString()}</p>
            ) : null}
          </section>

          <section style={{ marginTop: 24, padding: 20, border: "1px solid #ddd" }}>
            <h2>Authenticity Check</h2>
            <p>
              This page is generated directly by TrustLayer and reflects the
              current credential status for this platform.
            </p>
            <p>
              Result:{" "}
              <strong>
                {data.verified
                  ? "Credential is active and verified."
                  : "Credential is not currently active."}
              </strong>
            </p>
          </section>
        </>
      ) : null}
    </main>
  );
}
