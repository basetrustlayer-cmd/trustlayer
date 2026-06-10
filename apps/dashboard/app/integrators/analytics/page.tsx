import Link from "next/link";

const metrics = [
  { label: "API Calls", value: "18,420", change: "+12.4%" },
  { label: "TrustScore Lookups", value: "6,280", change: "+8.1%" },
  { label: "Verification Requests", value: "412", change: "+15.7%" },
  { label: "Entities Monitored", value: "1,084", change: "+21.3%" }
];

const activity = [
  { label: "Entity verification completed", count: 184 },
  { label: "TrustScore retrieved", count: 6280 },
  { label: "Trust badge rendered", count: 932 },
  { label: "Webhook events delivered", count: 1412 }
];

const distributions = [
  { label: "Excellent", value: 38 },
  { label: "Good", value: 44 },
  { label: "Watchlist", value: 14 },
  { label: "High Risk", value: 4 }
];

export default function IntegratorAnalyticsPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <Link href="/integrators" className="text-sm font-medium text-cyan-200 hover:text-cyan-100">
          ← Back to Integrator Portal
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            Usage Analytics Command Center
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Measure trust infrastructure performance.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            Monitor API usage, verification volume, TrustScore lookups, badge
            visibility, webhook delivery, and trust distribution across your platform.
          </p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {metrics.map((metric) => (
            <article key={metric.label} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <p className="text-sm text-slate-400">{metric.label}</p>
              <p className="mt-3 text-2xl font-semibold">{metric.value}</p>
              <p className="mt-2 text-sm text-emerald-200">{metric.change} this month</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Trust Activity</h2>
            <div className="mt-5 grid gap-3">
              {activity.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <span className="text-sm text-slate-300">{item.label}</span>
                  <span className="text-sm font-semibold text-cyan-200">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </article>

          <aside className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
            <h2 className="text-xl font-semibold text-cyan-100">TrustScore Distribution</h2>
            <div className="mt-5 grid gap-4">
              {distributions.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm text-cyan-50">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-950/50">
                    <div
                      className="h-full rounded-full bg-cyan-300"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <InsightCard
            title="Activation"
            value="72%"
            description="Trial integrations that completed first TrustScore lookup."
          />
          <InsightCard
            title="Trust Signal Coverage"
            value="64%"
            description="Active entities with public badge or embedded trust signal."
          />
          <InsightCard
            title="Webhook Reliability"
            value="99.8%"
            description="Delivered webhook events across verification and scoring workflows."
          />
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold">Revenue Impact Signals</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Usage analytics helps integrators connect TrustLayer adoption to lower
            fraud exposure, higher transaction confidence, stronger seller
            verification, and increased trust signal visibility.
          </p>
        </section>
      </section>
    </main>
  );
}

function InsightCard({
  title,
  value,
  description
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </article>
  );
}
