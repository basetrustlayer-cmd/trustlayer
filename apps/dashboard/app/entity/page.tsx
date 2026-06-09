import Link from "next/link";

const entityProgress = [
  { label: "Create Trust Entity", complete: true },
  { label: "Verify Identity", complete: true },
  { label: "Upload Evidence", complete: true },
  { label: "Generate TrustScore", complete: true },
  { label: "Publish Trust Badge", complete: false }
];

const trustActions = [
  {
    title: "Improve TrustScore",
    description: "Complete verification and add evidence to increase customer confidence.",
    href: "/trust-score"
  },
  {
    title: "Manage Verification",
    description: "Track your identity or business verification package.",
    href: "/verification/requests"
  },
  {
    title: "Publish Trust Badge",
    description: "Share your verified trust status with customers and counterparties.",
    href: "/certification/badge"
  },
  {
    title: "View Public Profile",
    description: "Preview how your trust entity appears in the network.",
    href: "/vendors/example"
  }
];

export default function EntityPortalHomePage() {
  const completedSteps = entityProgress.filter((step) => step.complete).length;
  const progress = Math.round((completedSteps / entityProgress.length) * 100);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm font-medium text-cyan-200 hover:text-cyan-100">
          ← Back to Trust Center
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            Trust Entity Portal
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Build trust before every transaction.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            This free portal helps individuals and businesses generate a TrustScore,
            verify their identity, publish a trust badge, and improve customer
            confidence. The same entity may act as a buyer in one transaction and a
            seller in another, but seller-side verification is emphasized because it
            is usually the highest counterparty-risk role.
          </p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <MetricCard label="TrustScore" value="88/100" detail="High confidence" />
          <MetricCard label="Entity Type" value="Individual" detail="Can act as buyer or seller" />
          <MetricCard label="Verification" value="Enhanced" detail="Seller-side ready" />
          <MetricCard label="Badge" value="Pending" detail="One step remaining" />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Trust Readiness</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Complete these steps to increase trust and publish your reputation.
                </p>
              </div>
              <p className="text-3xl font-semibold text-cyan-200">{progress}%</p>
            </div>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-cyan-300" style={{ width: `${progress}%` }} />
            </div>

            <div className="mt-6 grid gap-3">
              {entityProgress.map((step) => (
                <div
                  key={step.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <span className="text-sm text-slate-300">{step.label}</span>
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-medium",
                      step.complete
                        ? "bg-emerald-300/10 text-emerald-200"
                        : "bg-amber-300/10 text-amber-200"
                    ].join(" ")}
                  >
                    {step.complete ? "Complete" : "Next"}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Next Best Actions</h2>
            <div className="mt-5 grid gap-4">
              {trustActions.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition hover:bg-white/10"
                >
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold">Free Entity Access</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Trust entities do not need a paid trial. Individuals and businesses can
            maintain a free trust profile because every verified entity strengthens
            the TrustLayer network. Paid plans are reserved for integrators who use
            TrustLayer through APIs, SDKs, webhooks, and embedded trust signaling.
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
