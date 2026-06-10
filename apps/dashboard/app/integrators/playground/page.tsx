"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const examples = {
  createEntity: {
    title: "Create Entity",
    endpoint: "POST /v1/entities",
    code: `const entity = await trustlayer.entities.create({
  displayName: "Kumasi Agro Supplies",
  entityType: "BUSINESS",
  primaryRiskRole: "SELLER"
});`,
    response: `{
  "id": "entity_test_123",
  "displayName": "Kumasi Agro Supplies",
  "entityType": "BUSINESS",
  "primaryRiskRole": "SELLER",
  "status": "CREATED"
}`
  },
  startVerification: {
    title: "Start Verification",
    endpoint: "POST /v1/verify",
    code: `const verification = await trustlayer.verification.create({
  entityId: "entity_test_123",
  verificationType: "KYB",
  redirectUrl: "https://example.com/verification-complete"
});`,
    response: `{
  "id": "ver_test_456",
  "entityId": "entity_test_123",
  "status": "SUBMITTED",
  "verificationUrl": "https://trustlayer.dev/verify/ver_test_456"
}`
  },
  getTrustScore: {
    title: "Get TrustScore",
    endpoint: "GET /v1/trust-score/{entityId}",
    code: `const trustScore = await trustlayer.trustScore.get({
  entityId: "entity_test_123"
});`,
    response: `{
  "entityId": "entity_test_123",
  "score": 91,
  "band": "EXCELLENT",
  "confidence": 0.92,
  "verificationTier": "KYB_VERIFIED"
}`
  },
  getBadge: {
    title: "Get Trust Badge",
    endpoint: "GET /v1/badges/{entityId}",
    code: `const badge = await trustlayer.badges.get({
  entityId: "entity_test_123"
});`,
    response: `{
  "entityId": "entity_test_123",
  "status": "ACTIVE",
  "badgeUrl": "https://trustlayer.dev/badges/entity_test_123.svg",
  "verificationUrl": "https://trustlayer.dev/profile/entity_test_123"
}`
  }
};

type ExampleKey = keyof typeof examples;

export default function SdkPlaygroundPage() {
  const [selected, setSelected] = useState<ExampleKey>("createEntity");
  const [message, setMessage] = useState("");

  const example = useMemo(() => examples[selected], [selected]);

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
    setMessage("Copied to clipboard.");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <Link href="/integrators" className="text-sm font-medium text-cyan-200 hover:text-cyan-100">
          ← Back to Integrator Portal
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            SDK Playground
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Simulate TrustLayer API flows before writing production code.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            Explore common SDK requests for entity creation, verification,
            TrustScore lookup, and badge retrieval using sandbox-style examples.
          </p>
        </div>

        {message ? (
          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-100">
            {message}
          </div>
        ) : null}

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <MetricCard label="Mode" value="Sandbox" detail="Safe testing" />
          <MetricCard label="SDK" value="@trustlayer/sdk" detail="TypeScript-ready" />
          <MetricCard label="Auth" value="API Key" detail="Bearer token" />
          <MetricCard label="Responses" value="JSON" detail="Mock preview" />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Examples</h2>
            <div className="mt-5 grid gap-3">
              {(Object.keys(examples) as ExampleKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelected(key);
                    setMessage("");
                  }}
                  className={[
                    "rounded-2xl border p-4 text-left transition",
                    selected === key
                      ? "border-cyan-300 bg-cyan-300 text-slate-950"
                      : "border-white/10 bg-slate-950/50 text-slate-300 hover:bg-white/10"
                  ].join(" ")}
                >
                  <span className="block font-semibold">{examples[key].title}</span>
                  <span className="mt-1 block text-xs opacity-80">{examples[key].endpoint}</span>
                </button>
              ))}
            </div>
          </aside>

          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <h2 className="text-xl font-semibold">{example.title}</h2>
                <p className="mt-2 text-sm text-cyan-200">{example.endpoint}</p>
              </div>

              <button
                type="button"
                onClick={() => copyText(example.code)}
                className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Copy code
              </button>
            </div>

            <pre className="mt-5 overflow-auto rounded-2xl border border-white/10 bg-slate-950 p-4 text-xs leading-6 text-slate-300">
              {example.code}
            </pre>

            <div className="mt-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <h3 className="text-lg font-semibold">Mock Response</h3>

              <button
                type="button"
                onClick={() => copyText(example.response)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
              >
                Copy response
              </button>
            </div>

            <pre className="mt-4 overflow-auto rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-xs leading-6 text-cyan-50">
              {example.response}
            </pre>
          </article>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold">Sandbox Testing Flow</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {["Create entity", "Start verification", "Fetch TrustScore", "Render badge"].map(
              (step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <p className="text-sm text-cyan-200">Step {index + 1}</p>
                  <p className="mt-2 text-sm text-slate-300">{step}</p>
                </div>
              )
            )}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
          <h2 className="text-xl font-semibold text-cyan-100">
            Next integration milestone
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-cyan-50">
            Once your sandbox flow works, configure webhooks, validate production
            readiness, and activate live TrustLayer credentials.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/integrators/webhooks"
              className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Configure Webhooks
            </Link>
            <Link
              href="/integrators/production"
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-cyan-50"
            >
              Production Readiness
            </Link>
          </div>
        </section>
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
    <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-cyan-200">{detail}</p>
    </article>
  );
}
