import Link from "next/link";

const directoryStats = [
  { label: "Verified Entities", value: "1,248", detail: "Across platforms" },
  { label: "Average TrustScore", value: "82", detail: "Network quality" },
  { label: "Active Trust Badges", value: "936", detail: "Publicly verifiable" },
  { label: "High Confidence", value: "74%", detail: "Strong evidence base" }
];

const directoryItems = [
  {
    name: "Ama Mensah",
    type: "Individual",
    roles: "Buyer · Seller",
    tier: "Enhanced Verified",
    score: 88,
    status: "Trust Badge Active"
  },
  {
    name: "Kumasi Agro Supplies",
    type: "Business",
    roles: "Seller · Buyer",
    tier: "KYB Verified",
    score: 91,
    status: "Primary Seller Verified"
  },
  {
    name: "Logistics Operator",
    type: "Individual",
    roles: "Service Provider",
    tier: "Identity Verified",
    score: 79,
    status: "Monitoring"
  }
];

export default function PlatformsDirectoryPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm font-medium text-cyan-200 hover:text-cyan-100">
          ← Back to Trust Center
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            Trust Entity Explorer
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Discover trusted buyers, sellers, and counterparties.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            Explore individuals and businesses with portable TrustScores,
            verification tiers, trust badges, and role-aware reputation signals.
            Seller-side verification is emphasized because sellers and service
            providers are typically the primary source of counterparty risk.
          </p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {directoryStats.map((item) => (
            <article key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold">{item.value}</p>
              <p className="mt-2 text-sm text-cyan-200">{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-xl font-semibold">Entity Intelligence</h2>
              <p className="mt-2 text-sm text-slate-400">
                One entity can be a buyer in one transaction and a seller in the
                next. TrustLayer keeps reputation portable while prioritizing
                seller-side verification for marketplace risk reduction.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <input
                placeholder="Search entities"
                className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <select className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white">
                <option>All Entity Types</option>
                <option>Individual</option>
                <option>Business</option>
                <option>Organization</option>
              </select>
              <select className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white">
                <option>Sort by TrustScore</option>
                <option>Verified Sellers First</option>
                <option>Recently Verified</option>
                <option>Highest Confidence</option>
              </select>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4">
          {directoryItems.map((item) => (
            <article key={item.name} className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-lg font-semibold">{item.name}</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {item.type} · {item.roles} · {item.tier}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-sm font-medium text-cyan-200">
                    TrustScore {item.score}
                  </span>
                  <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-sm font-medium text-emerald-200">
                    {item.status}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
