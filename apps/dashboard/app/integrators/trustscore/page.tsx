import Link from "next/link";

const scoreFactors = [
  { label: "Identity Verification", weight: "30%", detail: "KYC/KYB confidence" },
  { label: "Seller-Side Risk", weight: "25%", detail: "Primary transaction risk" },
  { label: "Transaction History", weight: "20%", detail: "Behavior over time" },
  { label: "Disputes & Reviews", weight: "15%", detail: "Marketplace reputation" },
  { label: "Badge & Evidence", weight: "10%", detail: "Verified public signals" }
];

const endpoints = [
  {
    title: "Get TrustScore",
    method: "GET",
    path: "/v1/trust-score/{entityId}",
    body: `{
  "entityId": "entity_test_123",
  "score": 91,
  "band": "EXCELLENT",
  "confidence": 0.92,
  "verificationTier": "KYB_VERIFIED",
  "primaryRiskRole": "SELLER"
}`
  },
  {
    title: "Explain TrustScore",
    method: "GET",
    path: "/v1/trust-score/{entityId}/explain",
    body: `{
  "score": 91,
  "factors": {
    "identity": 29,
    "sellerRisk": 23,
    "transactions": 18,
    "reputation": 13,
    "evidence": 8
  }
}`
  },
  {
    title: "List Score History",
    method: "GET",
    path: "/v1/trust-score/{entityId}/history",
    body: `{
  "history": [
    { "score": 86, "reason": "verification.submitted" },
    { "score": 91, "reason": "verification.approved" }
  ]
}`
  }
];

export default function TrustScoreApiExplorerPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <Link href="/integrators" className="text-sm font-medium text-cyan-200 hover:text-cyan-100">
          ← Back to Integrator Portal
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            TrustScore API Explorer
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Retrieve portable trust intelligence.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            Understand how TrustLayer scores entities, explains confidence,
            weights seller-side risk, and exposes trust signals to integrator systems.
          </p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <MetricCard label="Score Range" value="0–100" detail="Portable trust score" />
          <MetricCard label="Confidence" value="0–1" detail="Evidence strength" />
          <MetricCard label="Primary Risk" value="Seller" detail="Default emphasis" />
          <MetricCard label="Output" value="JSON" detail="API ready" />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Score Composition</h2>
            <div className="mt-5 grid gap-3">
              {scoreFactors.map((factor) => (
                <div
                  key={factor.label}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{factor.label}</p>
                    <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                      {factor.weight}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{factor.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">TrustScore Endpoints</h2>
            <div className="mt-5 grid gap-4">
              {endpoints.map((endpoint) => (
                <div
                  key={endpoint.title}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                      {endpoint.method}
                    </span>
                    <code className="text-sm text-slate-200">{endpoint.path}</code>
                  </div>
                  <p className="mt-3 text-sm font-semibold">{endpoint.title}</p>
                  <pre className="mt-3 overflow-auto rounded-xl border border-white/10 bg-slate-950 p-4 text-xs leading-6 text-slate-300">
                    {endpoint.body}
                  </pre>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
            <h2 className="text-xl font-semibold text-cyan-100">
              Seller-Side Risk Emphasis
            </h2>
            <p className="mt-3 text-sm leading-6 text-cyan-50">
              An entity can be a buyer in one transaction and a seller in another.
              TrustLayer keeps one portable entity score while weighting seller-side
              verification heavily because sellers, providers, and fund recipients
              often represent the highest counterparty risk.
            </p>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Badge Eligibility</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              TrustScore outputs can be combined with approved verification,
              document evidence, and confidence thresholds to determine whether an
              entity can display a TrustLayer badge.
            </p>
          </article>
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
