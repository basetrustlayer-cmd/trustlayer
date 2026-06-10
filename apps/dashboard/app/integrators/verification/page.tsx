import Link from "next/link";

const verificationTypes = [
  {
    title: "Identity Verification",
    code: "KYC",
    description: "Verify individuals using identity evidence."
  },
  {
    title: "Business Verification",
    code: "KYB",
    description: "Verify organizations and business records."
  },
  {
    title: "Document Review",
    code: "DOC",
    description: "Review uploaded evidence and supporting documents."
  },
  {
    title: "Enhanced Verification",
    code: "EV",
    description: "Additional risk and compliance checks."
  }
];

const endpoints = [
  {
    method: "POST",
    path: "/v1/verifications",
    title: "Create Verification Request",
    response: `{
  "id": "vr_123",
  "status": "SUBMITTED"
}`
  },
  {
    method: "GET",
    path: "/v1/verifications/{id}",
    title: "Retrieve Verification",
    response: `{
  "id": "vr_123",
  "status": "IN_REVIEW"
}`
  },
  {
    method: "GET",
    path: "/v1/verifications/{id}/documents",
    title: "List Documents",
    response: `{
  "documents": []
}`
  }
];

export default function VerificationApiExplorerPage() {
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
            Verification API Explorer
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Verification infrastructure for trusted commerce.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            Launch verification workflows, collect evidence, review documents,
            and manage trust onboarding across your ecosystem.
          </p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {verificationTypes.map((item) => (
            <article
              key={item.code}
              className="rounded-3xl border border-white/10 bg-white/[0.06] p-5"
            >
              <p className="text-xs uppercase tracking-wider text-cyan-300">
                {item.code}
              </p>
              <h2 className="mt-3 text-lg font-semibold">
                {item.title}
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                {item.description}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold">
            Verification Endpoints
          </h2>

          <div className="mt-5 grid gap-4">
            {endpoints.map((endpoint) => (
              <article
                key={endpoint.path}
                className="rounded-2xl border border-white/10 bg-slate-950/50 p-5"
              >
                <div className="flex flex-wrap gap-3">
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

                <pre className="mt-4 overflow-auto rounded-xl border border-white/10 bg-slate-950 p-4 text-xs text-slate-300">
{endpoint.response}
                </pre>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
          <h2 className="text-xl font-semibold text-cyan-100">
            Verification → TrustScore Pipeline
          </h2>

          <p className="mt-3 text-sm leading-6 text-cyan-50">
            Verification events feed the TrustLayer trust engine. Approved
            identity evidence, business evidence, and document reviews improve
            confidence and contribute to TrustScore generation.
          </p>
        </section>
      </section>
    </main>
  );
}
