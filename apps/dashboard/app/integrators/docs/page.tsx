import Link from "next/link";

const guides = [
  {
    title: "Quickstart",
    description: "Install the SDK, configure your API key, and make your first request.",
    href: "/integrators/developer"
  },
  {
    title: "Entity Verification",
    description: "Create and verify entities across individual, business, and organization use cases.",
    href: "/verification/requests"
  },
  {
    title: "TrustScore API",
    description: "Retrieve portable trust scores and confidence signals for verified entities.",
    href: "/trust-score"
  },
  {
    title: "Webhooks",
    description: "Receive real-time events for verification, TrustScore, badge, and entity updates.",
    href: "/integrators/webhooks"
  }
];

const endpoints = [
  { method: "POST", path: "/v1/entities", description: "Create or register a trust entity." },
  { method: "POST", path: "/v1/verify", description: "Start an entity verification workflow." },
  { method: "GET", path: "/v1/trust-score/{entityId}", description: "Retrieve TrustScore intelligence." },
  { method: "GET", path: "/v1/badges/{entityId}", description: "Fetch badge status and public verification URLs." },
  { method: "POST", path: "/v1/webhooks/test", description: "Send a test webhook event." }
];

const concepts = [
  "Trust Entity",
  "Integrator",
  "Verification Tier",
  "TrustScore",
  "Trust Badge",
  "Webhook Event",
  "Production Activation",
  "Seller-Side Risk"
];

export default function IntegratorDocsPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <Link href="/integrators" className="text-sm font-medium text-cyan-200 hover:text-cyan-100">
          ← Back to Integrator Portal
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            Developer Documentation Hub
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Build with TrustLayer faster.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            Self-service documentation for integrating entity verification,
            TrustScore intelligence, trust badges, webhooks, and production
            trust signaling into your platform.
          </p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <MetricCard label="SDK" value="Ready" detail="@trustlayer/sdk" />
          <MetricCard label="Environment" value="Sandbox" detail="Trial first" />
          <MetricCard label="API Style" value="REST" detail="JSON responses" />
          <MetricCard label="Events" value="Webhooks" detail="Signed payloads" />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Integration Guides</h2>
            <div className="mt-5 grid gap-3">
              {guides.map((guide) => (
                <Link
                  key={guide.title}
                  href={guide.href}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition hover:bg-white/10"
                >
                  <h3 className="font-semibold">{guide.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {guide.description}
                  </p>
                </Link>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Core API Endpoints</h2>
            <div className="mt-5 grid gap-3">
              {endpoints.map((endpoint) => (
                <div
                  key={`${endpoint.method}-${endpoint.path}`}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                      {endpoint.method}
                    </span>
                    <code className="text-sm text-slate-200">{endpoint.path}</code>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{endpoint.description}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
          <h2 className="text-xl font-semibold text-cyan-100">Quickstart</h2>
          <pre className="mt-5 overflow-auto rounded-2xl border border-cyan-300/20 bg-slate-950 p-4 text-xs leading-6 text-slate-300">
{`pnpm add @trustlayer/sdk

import { TrustLayerClient } from "@trustlayer/sdk";

const trustlayer = new TrustLayerClient({
  apiKey: process.env.TRUSTLAYER_API_KEY
});

const entity = await trustlayer.entities.create({
  displayName: "Kumasi Agro Supplies",
  entityType: "BUSINESS"
});

const trustScore = await trustlayer.trustScore.get({
  entityId: entity.id
});`}
          </pre>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold">Core Concepts</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {concepts.map((concept) => (
              <span
                key={concept}
                className="rounded-full border border-white/10 bg-slate-950/50 px-4 py-2 text-sm text-slate-300"
              >
                {concept}
              </span>
            ))}
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
