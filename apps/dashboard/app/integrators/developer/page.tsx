import Link from "next/link";

const sdks = [
  { name: "JavaScript SDK", install: "pnpm add @trustlayer/sdk", status: "Recommended" },
  { name: "Node.js", install: "pnpm add @trustlayer/sdk", status: "Backend" },
  { name: "Next.js", install: "pnpm add @trustlayer/sdk", status: "App Router Ready" },
  { name: "React", install: "pnpm add @trustlayer/sdk", status: "Frontend Signals" }
];

const apis = [
  "Entity Verification",
  "TrustScore Lookup",
  "Trust Badge Status",
  "Public Entity Profile",
  "Webhook Events",
  "Fraud Risk Signals"
];

const quickStart = `import { TrustLayerClient } from "@trustlayer/sdk";

const trustlayer = new TrustLayerClient({
  apiKey: process.env.TRUSTLAYER_API_KEY
});

const score = await trustlayer.trustScore.get({
  entityId: "entity_test_123"
});`;

export default function IntegratorDeveloperPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <Link href="/integrators" className="text-sm font-medium text-cyan-200 hover:text-cyan-100">
          ← Back to Integrator Portal
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            API Key & SDK Command Center
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Build your first TrustLayer integration.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            Generate sandbox credentials, install the SDK, verify entities,
            retrieve TrustScores, and display trust signals in your product.
          </p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <MetricCard label="Environment" value="Sandbox" detail="Trial active" />
          <MetricCard label="API Key" value="Active" detail="Test mode" />
          <MetricCard label="SDK Setup" value="<30 min" detail="Fast integration" />
          <MetricCard label="Webhook Health" value="Ready" detail="Events available" />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Sandbox API Key</h2>
            <p className="mt-2 text-sm text-slate-400">
              Use this key for trial integrations and test verification workflows.
            </p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-400">Test key</p>
              <code className="mt-2 block break-all text-sm text-cyan-200">
                tl_test_xxxxxxxxxxxxxxxxxxxxxxxx
              </code>
              <p className="mt-3 text-xs text-slate-500">
                Production keys become available after plan activation.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Copy API key
              </button>
              <button
                type="button"
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
              >
                Rotate key
              </button>
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Quick Start</h2>
            <p className="mt-2 text-sm text-slate-400">
              Install the SDK and request your first TrustScore.
            </p>

            <pre className="mt-5 overflow-auto rounded-2xl border border-white/10 bg-slate-950 p-4 text-xs leading-6 text-slate-300">
              {quickStart}
            </pre>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">SDKs</h2>
            <div className="mt-5 grid gap-3">
              {sdks.map((sdk) => (
                <div
                  key={sdk.name}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{sdk.name}</p>
                    <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
                      {sdk.status}
                    </span>
                  </div>
                  <code className="mt-3 block text-sm text-slate-300">{sdk.install}</code>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Available APIs</h2>
            <div className="mt-5 grid gap-3">
              {apis.map((api) => (
                <div
                  key={api}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300"
                >
                  {api}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
          <h2 className="text-xl font-semibold text-cyan-100">
            Recommended Trial Goal
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-cyan-50">
            Before your trial ends, generate an API key, verify one test entity,
            retrieve its TrustScore, and render a trust signal in your application.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/api-docs"
              className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Open API Docs
            </Link>
            <Link
              href="/integrators/trial"
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-cyan-50"
            >
              View Trial Progress
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
