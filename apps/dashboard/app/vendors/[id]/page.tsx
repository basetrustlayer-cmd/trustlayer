import Link from "next/link";

const trustSignals = [
  { label: "Identity Verified", status: "Verified" },
  { label: "Business Evidence", status: "Reviewed" },
  { label: "Trust Badge", status: "Active" },
  { label: "Reputation Portability", status: "Enabled" }
];

const recentActivity = [
  "TrustScore refreshed from verified evidence",
  "Verification package reviewed",
  "Public trust badge generated"
];

export default async function PublicProfilePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <Link href="/vendors" className="text-sm font-medium text-cyan-200 hover:text-cyan-100">
          ← Back to Trust Network Directory
        </Link>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-8">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            Public Trust Profile
          </p>

          <div className="mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">
                Verified Network Subject
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                A public reputation profile generated from verified identity,
                TrustScore intelligence, certification evidence, and portable
                trust signals.
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6 text-center">
              <p className="text-sm text-cyan-100">TrustScore</p>
              <p className="mt-2 text-5xl font-semibold text-white">91</p>
              <p className="mt-2 text-sm text-cyan-200">Excellent</p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <MetricCard label="Verification Tier" value="KYB Verified" />
          <MetricCard label="Badge Status" value="Active" />
          <MetricCard label="Confidence" value="High" />
          <MetricCard label="Profile Type" value="Business" />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Trust Signals</h2>
            <div className="mt-5 grid gap-3">
              {trustSignals.map((signal) => (
                <div
                  key={signal.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <span className="text-sm text-slate-300">{signal.label}</span>
                  <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200">
                    {signal.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Evidence Summary</h2>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              This profile is designed to expose only public, consented trust
              signals. Sensitive verification documents remain private while
              their resulting trust status can be verified by counterparties.
            </p>

            <Link
              href="/certification/badge"
              className="mt-5 inline-flex rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              View Trust Badge
            </Link>
          </aside>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold">Recent Trust Activity</h2>
          <div className="mt-5 grid gap-3">
            {recentActivity.map((activity) => (
              <div
                key={activity}
                className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300"
              >
                {activity}
              </div>
            ))}
          </div>
        </section>
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
