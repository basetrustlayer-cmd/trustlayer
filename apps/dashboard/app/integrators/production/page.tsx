import Link from "next/link";

const readinessChecks = [
  {
    label: "Sandbox API Connected",
    status: "Complete"
  },
  {
    label: "Test Entity Verified",
    status: "Complete"
  },
  {
    label: "TrustScore Retrieved",
    status: "Complete"
  },
  {
    label: "Webhook Endpoint Registered",
    status: "Pending"
  },
  {
    label: "Compliance Review",
    status: "Pending"
  }
];

const plans = [
  {
    name: "Starter",
    price: "$99/mo",
    description: "Early-stage products validating trust workflows."
  },
  {
    name: "Growth",
    price: "$499/mo",
    description: "Scaling platforms onboarding verified entities."
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "High-volume trust infrastructure deployments."
  }
];

export default function ProductionActivationPage() {
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
            Production Activation
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Move from trial to live TrustLayer infrastructure.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            Complete readiness checks, select a production plan,
            provision live credentials, and activate TrustLayer across
            your platform.
          </p>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">
              Production Readiness
            </h2>

            <div className="mt-6 grid gap-4">
              {readinessChecks.map((check) => (
                <div
                  key={check.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <span>{check.label}</span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      check.status === "Complete"
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {check.status}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
            <p className="text-sm uppercase tracking-wider text-cyan-100">
              Production Credentials
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              Live API Access
            </h2>

            <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-slate-950/60 p-4">
              <p className="text-xs text-slate-400">
                Production Key
              </p>

              <code className="mt-2 block text-sm text-cyan-300">
                tl_live_xxxxxxxxxxxxxxxxxxxx
              </code>
            </div>

            <div className="mt-6">
              <button
                type="button"
                className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
              >
                Activate Production
              </button>
            </div>
          </article>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">
            Production Plans
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className="rounded-3xl border border-white/10 bg-white/[0.06] p-6"
              >
                <h3 className="text-xl font-semibold">
                  {plan.name}
                </h3>

                <p className="mt-3 text-3xl font-bold">
                  {plan.price}
                </p>

                <p className="mt-4 text-sm text-slate-400">
                  {plan.description}
                </p>

                <button
                  type="button"
                  className="mt-6 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/5"
                >
                  Select Plan
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold">
            Go-Live Checklist
          </h2>

          <div className="mt-6 grid gap-3">
            {[
              "Webhook endpoint configured",
              "Allowed domains registered",
              "Rate limits reviewed",
              "Compliance requirements approved",
              "Monitoring enabled"
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
