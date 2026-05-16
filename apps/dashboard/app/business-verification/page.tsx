"use client";

import { useState } from "react";

type VerificationResponse = {
  subject?: {
    verificationTier?: string;
    externalId?: string;
  };
  trustScore?: {
    score?: number;
    confidence?: number;
  };
  verificationSession?: {
    status?: string;
  };
  error?: string;
};

export default function BusinessVerificationPage() {
  const [businessName, setBusinessName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [country, setCountry] = useState("GH");
  const [registry, setRegistry] = useState("MOCK");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/business-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          businessName,
          registrationNumber,
          country,
          registry
        })
      });

      const data = (await response.json()) as VerificationResponse;
      setResult(data);
    } catch {
      setResult({
        error: "Unable to submit verification request."
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Business Verification</h1>
        <p className="text-sm opacity-80 mt-2">
          Verify your business registration and generate a trust score.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium mb-1">
            Business Name
          </label>
          <input
            className="w-full border rounded px-3 py-2"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Registration Number
          </label>
          <input
            className="w-full border rounded px-3 py-2"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Country</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="GH">Ghana</option>
            <option value="NG">Nigeria</option>
            <option value="US">United States</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Registry</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={registry}
            onChange={(e) => setRegistry(e.target.value)}
          >
            <option value="MOCK">Mock (Demo)</option>
            <option value="GHANA_ORC">Ghana ORC</option>
            <option value="NIGERIA_CAC">Nigeria CAC</option>
            <option value="US_SECRETARY_OF_STATE">
              U.S. Secretary of State
            </option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify Business"}
        </button>
      </form>

      {result && (
        <section className="border rounded-lg p-6 space-y-2">
          {result.error ? (
            <p className="text-red-600">{result.error}</p>
          ) : (
            <>
              <h2 className="text-xl font-semibold">Verification Result</h2>
              <p>
                <strong>Status:</strong>{" "}
                {result.verificationSession?.status ?? "Unknown"}
              </p>
              <p>
                <strong>Verification Tier:</strong>{" "}
                {result.subject?.verificationTier ?? "Unknown"}
              </p>
              <p>
                <strong>Trust Score:</strong>{" "}
                {result.trustScore?.score ?? 0}
              </p>
              <p>
                <strong>Confidence:</strong>{" "}
                {result.trustScore?.confidence ?? 0}
              </p>
              <p>
                <strong>Subject ID:</strong>{" "}
                {result.subject?.externalId ?? "N/A"}
              </p>
            </>
          )}
        </section>
      )}
    </main>
  );
}
