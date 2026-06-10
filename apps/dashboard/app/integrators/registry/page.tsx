import Link from "next/link";

const registryRecords = [
  {
    type: "Business",
    name: "Acme Logistics Ltd",
    trustScore: 91,
    status: "Verified"
  },
  {
    type: "Individual",
    name: "Verified Merchant",
    trustScore: 84,
    status: "Trust Badge Active"
  },
  {
    type: "Supplier",
    name: "Global Components",
    trustScore: 88,
    status: "Enhanced Verified"
  }
];

const endpoints = [
  {
    method: "GET",
    path: "/v1/registry/search",
    title: "Search Registry"
  },
  {
    method: "GET",
    path: "/v1/registry/{entityId}",
    title: "Retrieve Public Trust Record"
  },
  {
    method: "GET",
    path: "/v1/registry/{entityId}/badge",
    title: "Retrieve Public Badge"
  }
];

export default function TrustRegistryExplorerPage() {
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
            Trust Registry Explorer
          </p>

          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">
            Search portable reputation across the network.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            The Trust Registry exposes public trust records, badges,
            verification status and TrustScores that can be independently
            verified by any participant in the ecosystem.
          </p>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <input
              placeholder="Search entity, organization, merchant or supplier"
              className="flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
            />

            <button className="rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">
              Search Registry
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-4">
          {registryRecords.map((record) => (
            <article
              key={record.name}
              className="rounded-3xl border border-white/10 bg-white/[0.06] p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-slate-400">{record.type}</p>
                  <h2 className="mt-2 text-xl font-semibold">
                    {record.name}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-3">
                  <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-sm text-cyan-200">
                    TrustScore {record.trustScore}
                  </span>

                  <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-sm text-emerald-200">
                    {record.status}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold">
            Registry APIs
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
            Portable Reputation Infrastructure
          </h2>

          <p className="mt-3 text-sm leading-6 text-cyan-50">
            Trust earned in one platform becomes verifiable in another.
            The Trust Registry acts as the public reputation layer
            connecting all TrustLayer-enabled ecosystems.
          </p>
        </section>
      </section>
    </main>
  );
}
