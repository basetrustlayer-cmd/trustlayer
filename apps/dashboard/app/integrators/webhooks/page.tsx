import Link from "next/link";

const webhookMetrics = [
  { label: "Events Delivered", value: "1,412", detail: "Last 30 days" },
  { label: "Delivery Success", value: "99.8%", detail: "Healthy" },
  { label: "Failed Events", value: "3", detail: "Needs review" },
  { label: "Active Endpoints", value: "2", detail: "Production + sandbox" }
];

const eventTypes = [
  "entity.created",
  "entity.updated",
  "verification.submitted",
  "verification.approved",
  "verification.rejected",
  "trustscore.updated",
  "badge.issued",
  "badge.expired"
];

const deliveries = [
  {
    event: "verification.approved",
    endpoint: "https://api.example.com/trustlayer/webhooks",
    status: "Delivered",
    time: "2 minutes ago"
  },
  {
    event: "trustscore.updated",
    endpoint: "https://api.example.com/trustlayer/webhooks",
    status: "Delivered",
    time: "14 minutes ago"
  },
  {
    event: "badge.issued",
    endpoint: "https://sandbox.example.com/webhooks",
    status: "Retrying",
    time: "28 minutes ago"
  }
];

export default function WebhookEventMonitorPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <Link href="/integrators" className="text-sm font-medium text-cyan-200 hover:text-cyan-100">
          ← Back to Integrator Portal
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            Webhook Event Monitor
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Monitor real-time trust events.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            Track verification decisions, TrustScore updates, badge lifecycle events,
            entity changes, delivery success, retries, and endpoint health.
          </p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {webhookMetrics.map((metric) => (
            <article key={metric.label} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <p className="text-sm text-slate-400">{metric.label}</p>
              <p className="mt-3 text-2xl font-semibold">{metric.value}</p>
              <p className="mt-2 text-sm text-cyan-200">{metric.detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Subscribed Events</h2>
            <div className="mt-5 grid gap-3">
              {eventTypes.map((event) => (
                <div
                  key={event}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300"
                >
                  {event}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Recent Deliveries</h2>
            <div className="mt-5 grid gap-3">
              {deliveries.map((delivery) => (
                <div
                  key={`${delivery.event}-${delivery.time}`}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                      <p className="font-medium text-white">{delivery.event}</p>
                      <p className="mt-1 break-all text-sm text-slate-400">{delivery.endpoint}</p>
                      <p className="mt-1 text-xs text-slate-500">{delivery.time}</p>
                    </div>

                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        delivery.status === "Delivered"
                          ? "bg-emerald-300/10 text-emerald-200"
                          : "bg-amber-300/10 text-amber-200"
                      ].join(" ")}
                    >
                      {delivery.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
            <h2 className="text-xl font-semibold text-cyan-100">Production Endpoint</h2>
            <p className="mt-3 break-all rounded-2xl border border-cyan-300/20 bg-slate-950/60 p-4 text-sm text-cyan-200">
              https://api.example.com/trustlayer/webhooks
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Send Test Event
              </button>
              <button
                type="button"
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-cyan-50"
              >
                Rotate Signing Secret
              </button>
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Webhook Signing</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Verify TrustLayer webhook signatures before processing events in your
              system. This protects your integration from spoofed verification,
              TrustScore, badge, and entity lifecycle events.
            </p>
            <pre className="mt-5 overflow-auto rounded-2xl border border-white/10 bg-slate-950 p-4 text-xs leading-6 text-slate-300">
{`const signature = request.headers["x-trustlayer-signature"];

verifyTrustLayerWebhook({
  payload,
  signature,
  secret: process.env.TRUSTLAYER_WEBHOOK_SECRET
});`}
            </pre>
          </article>
        </section>
      </section>
    </main>
  );
}
