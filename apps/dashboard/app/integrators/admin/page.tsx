import Link from "next/link";

const stats = [
  {
    label: "API Requests",
    value: "2.4M"
  },
  {
    label: "Verified Entities",
    value: "18,421"
  },
  {
    label: "TrustScores Generated",
    value: "145,830"
  },
  {
    label: "Active Webhooks",
    value: "32"
  }
];

const modules = [
  {
    title: "Trial Program",
    href: "/integrators/trial"
  },
  {
    title: "API Keys",
    href: "/integrators/api-keys"
  },
  {
    title: "Billing",
    href: "/integrators/billing"
  },
  {
    title: "Usage Analytics",
    href: "/integrators/analytics"
  },
  {
    title: "Webhook Monitor",
    href: "/integrators/webhooks"
  },
  {
    title: "Verification APIs",
    href: "/integrators/verification"
  },
  {
    title: "TrustScore APIs",
    href: "/integrators/trustscore"
  },
  {
    title: "Badge APIs",
    href: "/integrators/badges"
  },
  {
    title: "Registry APIs",
    href: "/integrators/registry"
  }
];

export default function IntegratorAdminConsolePage() {
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
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            Integrator Admin Console
          </p>

          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">
            Manage your TrustLayer integration.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            A unified operational dashboard for verification,
            trust scoring, trust signals, usage, billing,
            and platform integrations.
          </p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {stats.map((item) => (
            <article
              key={item.label}
              className="rounded-3xl border border-white/10 bg-white/[0.06] p-5"
            >
              <p className="text-sm text-slate-400">
                {item.label}
              </p>

              <p className="mt-3 text-3xl font-semibold">
                {item.value}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">
            Platform Modules
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {modules.map((module) => (
              <Link
                key={module.title}
                href={module.href}
                className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 transition hover:border-cyan-300/30 hover:bg-white/[0.08]"
              >
                <h3 className="font-semibold">
                  {module.title}
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Open module →
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
          <h2 className="text-xl font-semibold text-cyan-100">
            Trust Infrastructure Overview
          </h2>

          <p className="mt-3 text-sm leading-6 text-cyan-50">
            TrustLayer combines verification, trust scoring,
            portable reputation, and public trust signals into a
            single programmable trust infrastructure.
          </p>
        </section>
      </section>
    </main>
  );
}
