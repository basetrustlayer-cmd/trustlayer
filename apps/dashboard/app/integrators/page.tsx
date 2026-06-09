import Link from "next/link";

const setupSteps = [
  "Start free trial",
  "Create application",
  "Generate API key",
  "Install SDK",
  "Verify first entity",
  "Display trust signals"
];

const products = [
  "Identity Verification",
  "TrustScore API",
  "Trust Badges",
  "Webhook Events",
  "Fraud Signals",
  "SDK Integration"
];

export default function IntegratorPortalPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm font-medium text-cyan-200 hover:text-cyan-100">
          ← Back to Trust Center
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            TrustLayer Integrator Portal
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Embed trust directly into your platform.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            For marketplaces, fintechs, lenders, procurement systems, logistics
            platforms, and SaaS products that want to verify entities, consume
            TrustScores, and display trust signals through APIs and SDKs.
          </p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <MetricCard label="Trial" value="14 days" detail="Sandbox access" />
          <MetricCard label="SDK Setup" value="<30 min" detail="Developer-first flow" />
          <MetricCard label="Trust APIs" value="Active" detail="Verification + scoring" />
          <MetricCard label="Billing" value="Paid" detail="For integrators only" />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Integrator Setup Flow</h2>
            <p className="mt-2 text-sm text-slate-400">
              Move from trial signup to first trusted entity verification.
            </p>

            <div className="mt-5 grid gap-3">
              {setupSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-300 text-sm font-bold text-slate-950">
                    {index + 1}
                  </span>
                  <span className="text-sm text-slate-300">{step}</span>
                </div>
              ))}
            </div>
          </article>

          <aside className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
            <h2 className="text-xl font-semibold text-cyan-100">
              14-Day Free Trial
            </h2>
            <p className="mt-3 text-sm leading-6 text-cyan-50">
              Test TrustLayer in sandbox, generate API keys, verify sample
              entities, and preview embedded trust signals before choosing a
              paid plan.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/integrators/trial"
                className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
              >
                Start Trial
              </Link>
              <Link
                href="/api-docs"
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:bg-white/10"
              >
                View Developer Docs
              </Link>
            </div>
          </aside>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold">Integrator Products</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {products.map((product) => (
              <div
                key={product}
                className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300"
              >
                {product}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold">Integrator vs Entity</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
              <h3 className="font-semibold text-white">Trust Entity</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Free participant who wants to verify identity, generate a
                TrustScore, publish a badge, and improve customer confidence.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
              <h3 className="font-semibold text-cyan-100">TrustLayer Integrator</h3>
              <p className="mt-2 text-sm leading-6 text-cyan-50">
                Paying system owner that embeds TrustLayer through SDKs, APIs,
                webhooks, verification flows, and trust-signaling components.
              </p>
            </div>
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
