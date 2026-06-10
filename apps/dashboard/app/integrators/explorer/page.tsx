import Link from "next/link";

const lifecycle = [
  "Create Entity",
  "Start Verification",
  "Upload Evidence",
  "Review Submission",
  "Approve Verification",
  "Update TrustScore",
  "Issue Badge"
];

const statuses = [
  { status: "DRAFT", meaning: "Verification package created but not submitted." },
  { status: "SUBMITTED", meaning: "Entity has submitted verification evidence." },
  { status: "IN_REVIEW", meaning: "TrustLayer reviewer is evaluating documents." },
  { status: "APPROVED", meaning: "Verification has passed and can influence TrustScore." },
  { status: "REJECTED", meaning: "Evidence was insufficient or failed review." },
  { status: "EXPIRED", meaning: "Verification needs renewal or resubmission." }
];

const requests = [
  {
    title: "Create verification request",
    method: "POST",
    path: "/v1/verification/requests",
    body: `{
  "entityId": "entity_test_123",
  "verificationType": "KYB",
  "riskRole": "SELLER"
}`
  },
  {
    title: "Fetch verification status",
    method: "GET",
    path: "/v1/verification/requests/ver_test_456",
    body: `{
  "id": "ver_test_456",
  "status": "IN_REVIEW",
  "documentsSubmitted": 3,
  "documentsApproved": 2
}`
  },
  {
    title: "List verification documents",
    method: "GET",
    path: "/v1/verification/requests/ver_test_456/documents",
    body: `{
  "documents": [
    {
      "filename": "business-registration.pdf",
      "reviewStatus": "APPROVED"
    },
    {
      "filename": "tax-certificate.pdf",
      "reviewStatus": "PENDING"
    }
  ]
}`
  }
];

export default function VerificationApiExplorerPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <Link href="/integrators" className="text-sm font-medium text-cyan-200 hover:text-cyan-100">
          ← Back to Integrator Portal
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            Verification API Explorer
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Understand the verification lifecycle.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            Explore how integrators create verification requests, track submitted
            evidence, monitor reviewer decisions, and connect approved verification
            to TrustScore and badge eligibility.
          </p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <MetricCard label="Primary Risk Role" value="Seller" detail="Verification emphasized" />
          <MetricCard label="Review Model" value="Evidence" detail="Document-backed" />
          <MetricCard label="Decision Output" value="Status" detail="Approved or rejected" />
          <MetricCard label="Trust Impact" value="Score + Badge" detail="After approval" />
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-xl font-semibold">Verification Lifecycle</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-7">
            {lifecycle.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
              >
                <p className="text-sm text-cyan-200">Step {index + 1}</p>
                <p className="mt-2 text-sm text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Status Transitions</h2>
            <div className="mt-5 grid gap-3">
              {statuses.map((item) => (
                <div
                  key={item.status}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <p className="font-semibold text-cyan-200">{item.status}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {item.meaning}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Sample Requests</h2>
            <div className="mt-5 grid gap-4">
              {requests.map((request) => (
                <div
                  key={request.title}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                      {request.method}
                    </span>
                    <code className="text-sm text-slate-200">{request.path}</code>
                  </div>
                  <p className="mt-3 text-sm font-semibold">{request.title}</p>
                  <pre className="mt-3 overflow-auto rounded-xl border border-white/10 bg-slate-950 p-4 text-xs leading-6 text-slate-300">
                    {request.body}
                  </pre>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
            <h2 className="text-xl font-semibold text-cyan-100">
              Badge Eligibility Rule
            </h2>
            <p className="mt-3 text-sm leading-6 text-cyan-50">
              A trust badge becomes eligible when verification is approved,
              supporting evidence has passed review, and the entity meets the
              minimum TrustScore threshold.
            </p>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">TrustScore Impact</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Approved verification increases confidence and may raise the
              effective trust ceiling. Rejected or expired verification can
              lower confidence and limit badge eligibility.
            </p>
          </article>
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
