import Link from "next/link";

const badgeTypes = [
  {
    title: "Verified",
    description: "Basic verification completed."
  },
  {
    title: "Enhanced Verified",
    description: "Additional evidence reviewed."
  },
  {
    title: "KYB Verified",
    description: "Business verification completed."
  },
  {
    title: "Trust Certified",
    description: "High confidence trust status."
  }
];

const endpoints = [
  {
    method: "GET",
    path: "/v1/badges/{entityId}",
    title: "Retrieve Badge"
  },
  {
    method: "GET",
    path: "/v1/badges/{entityId}/embed",
    title: "Generate Embed Code"
  },
  {
    method: "GET",
    path: "/v1/badges/{entityId}/verify",
    title: "Verify Badge"
  }
];

export default function BadgeApiExplorerPage() {
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
            Badge API Explorer
          </p>

          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">
            Trust signals your users can see.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            Generate, embed, verify and display TrustLayer badges
            across marketplaces, commerce systems and partner networks.
          </p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {badgeTypes.map((badge) => (
            <article
              key={badge.title}
              className="rounded-3xl border border-white/10 bg-white/[0.06] p-5"
            >
              <h2 className="text-lg font-semibold">
                {badge.title}
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                {badge.description}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold">
            Badge Endpoints
          </h2>

          <div className="mt-5 grid gap-4">
            {endpoints.map((endpoint) => (
              <article
                key={endpoint.path}
                className="rounded-2xl border border-white/10 bg-slate-950/50 p-5"
              >
                <div className="flex gap-3">
                  <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                    {endpoint.method}
                  </span>

                  <code className="text-sm text-slate-300">
                    {endpoint.path}
                  </code>
                </div>

                <h3 className="mt-3 font-semibold">
                  {endpoint.title}
                </h3>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
          <h2 className="text-xl font-semibold text-cyan-100">
            Portable Trust Signals
          </h2>

          <p className="mt-3 text-sm leading-6 text-cyan-50">
            TrustLayer badges allow trust earned in one ecosystem
            to be displayed and verified in another ecosystem.
          </p>
        </section>
      </section>
    </main>
  );
}
