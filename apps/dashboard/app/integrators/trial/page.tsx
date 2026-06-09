import Link from "next/link";

const milestones = [
  {
    title: "Create Account",
    status: "Complete"
  },
  {
    title: "Generate API Key",
    status: "Next Step"
  },
  {
    title: "Verify First Entity",
    status: "Pending"
  },
  {
    title: "Generate TrustScore",
    status: "Pending"
  },
  {
    title: "Display Trust Signal",
    status: "Pending"
  },
  {
    title: "Go Live",
    status: "Pending"
  }
];

const apiKeys = [
  {
    name: "Sandbox Key",
    value: "tl_test_xxxxxxxxxxxxxxxx",
    status: "Active"
  }
];

export default function IntegratorTrialPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <Link
          href="/integrators"
          className="text-sm font-medium text-cyan-200 hover:text-cyan-100"
        >
          ← Back to Integrator Portal
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            Trial Command Center
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Launch your first trust-enabled workflow.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            Your 14-day trial provides sandbox access to TrustLayer APIs,
            TrustScore generation, verification workflows, and trust signals.
          </p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <MetricCard
            label="Trial Status"
            value="Active"
            detail="14 days remaining"
          />

          <MetricCard
            label="API Keys"
            value="1"
            detail="Sandbox"
          />

          <MetricCard
            label="Verified Entities"
            value="0"
            detail="Trial activity"
          />

          <MetricCard
            label="TrustScores"
            value="0"
            detail="Generated"
          />
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold">
            Trial Progress
          </h2>

          <div className="mt-5 grid gap-3">
            {milestones.map((item, index) => (
              <div
                key={item.title}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 p-4"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-300 font-bold text-slate-950">
                    {index + 1}
                  </span>

                  <span>{item.title}</span>
                </div>

                <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-200">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">
              API Credentials
            </h2>

            <div className="mt-5 space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key.name}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <p className="font-medium">{key.name}</p>

                  <code className="mt-2 block text-cyan-200">
                    {key.value}
                  </code>

                  <p className="mt-2 text-sm text-slate-400">
                    {key.status}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
            <h2 className="text-xl font-semibold text-cyan-100">
              Upgrade Path
            </h2>

            <p className="mt-4 text-sm leading-6 text-cyan-50">
              When your trial expires, migrate seamlessly to a paid plan
              and continue verifying entities, generating TrustScores,
              and displaying trust signals across your platform.
            </p>

            <div className="mt-5">
              <button
                type="button"
                className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Upgrade to Paid Plan
              </button>
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold">
            Recommended Next Action
          </h2>

          <p className="mt-4 text-sm leading-6 text-slate-300">
            Generate your first API key and verify a sample entity to
            experience the complete TrustLayer workflow.
          </p>
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
