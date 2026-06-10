import Link from "next/link";

const usageMetrics = [
  { label: "API Calls", value: "18,420", limit: "100,000 monthly" },
  { label: "TrustScore Lookups", value: "6,280", limit: "25,000 monthly" },
  { label: "Verification Requests", value: "412", limit: "2,000 monthly" },
  { label: "Entities Monitored", value: "1,084", limit: "10,000 monthly" }
];

const invoices = [
  { id: "INV-001", date: "2026-05-01", amount: "$499", status: "Paid" },
  { id: "INV-002", date: "2026-04-01", amount: "$499", status: "Paid" },
  { id: "INV-003", date: "2026-03-01", amount: "$499", status: "Paid" }
];

const plans = [
  {
    name: "Starter",
    price: "$99/mo",
    description: "For early-stage platforms validating trust workflows.",
    current: false
  },
  {
    name: "Growth",
    price: "$499/mo",
    description: "For scaling platforms embedding verification and TrustScores.",
    current: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For banks, governments, and high-volume trust infrastructure.",
    current: false
  }
];

export default function IntegratorBillingPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <Link href="/integrators" className="text-sm font-medium text-cyan-200 hover:text-cyan-100">
          ← Back to Integrator Portal
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            Billing & Subscription Center
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Manage your TrustLayer subscription.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            Review your current plan, usage, invoices, payment method, and upgrade
            options for production trust infrastructure.
          </p>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <article className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
            <p className="text-sm uppercase tracking-wider text-cyan-100">
              Current Plan
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Growth</h2>
            <p className="mt-2 text-2xl font-bold text-cyan-100">$499/month</p>
            <p className="mt-4 text-sm leading-6 text-cyan-50">
              Active production subscription for growing platforms using
              TrustLayer verification, TrustScore APIs, webhooks, and embedded
              trust signals.
            </p>

            <div className="mt-5 grid gap-3 text-sm text-cyan-50 sm:grid-cols-2">
              <p>Status: Active</p>
              <p>Renewal: June 12, 2026</p>
              <p>Environment: Production</p>
              <p>Billing contact: finance@example.com</p>
            </div>
          </article>

          <aside className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Payment Method</h2>
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-400">Default card</p>
              <p className="mt-2 text-lg font-semibold">Visa ending 4242</p>
              <p className="mt-1 text-sm text-slate-500">Expires 12/28</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Update Card
              </button>
              <button
                type="button"
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
              >
                Change Contact
              </button>
            </div>
          </aside>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          {usageMetrics.map((metric) => (
            <article key={metric.label} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <p className="text-sm text-slate-400">{metric.label}</p>
              <p className="mt-3 text-2xl font-semibold">{metric.value}</p>
              <p className="mt-2 text-sm text-cyan-200">{metric.limit}</p>
            </article>
          ))}
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Plans</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={[
                  "rounded-3xl border p-6",
                  plan.current
                    ? "border-cyan-300/40 bg-cyan-300/10"
                    : "border-white/10 bg-white/[0.06]"
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  {plan.current ? (
                    <span className="rounded-full bg-cyan-300 px-3 py-1 text-xs font-semibold text-slate-950">
                      Current
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-3xl font-bold">{plan.price}</p>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  {plan.description}
                </p>

                <button
                  type="button"
                  className="mt-6 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
                >
                  {plan.current ? "Manage Plan" : "Select Plan"}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold">Recent Invoices</h2>

          <div className="mt-5 grid gap-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="grid gap-2 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300 md:grid-cols-4"
              >
                <p>{invoice.id}</p>
                <p>{invoice.date}</p>
                <p>{invoice.amount}</p>
                <p className="text-emerald-200">{invoice.status}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
          <h2 className="text-xl font-semibold text-cyan-100">
            Billing Rule
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-cyan-50">
            Trust entities remain free because they grow the trust network.
            Integrators pay because they consume TrustLayer infrastructure through
            SDKs, APIs, webhooks, production keys, and embedded trust signaling.
          </p>
        </section>
      </section>
    </main>
  );
}
