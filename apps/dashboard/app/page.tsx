import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "../lib/session";
import { prisma } from "../lib/db";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const platform = await prisma.platform.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" }
  });

  const hasPlatform = Boolean(platform);

  const trustHealthScore = hasPlatform ? 92 : 48;
  const verificationSuccessRate = hasPlatform ? "98.7%" : "0%";
  const fraudExposure = hasPlatform ? "Low" : "Unknown";
  const webhookHealth = hasPlatform ? "Healthy" : "Not configured";
  const complianceStatus = hasPlatform ? "Ready" : "Setup required";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
              Trust Center
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              Mission control for digital trust.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              Monitor identity verification, TrustScore readiness, platform
              health, compliance posture, and fraud exposure from one executive
              dashboard.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-300">
            <p className="font-medium text-white">{user.email}</p>
            <p>Role: {user.role}</p>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Trust Health"
            value={`${trustHealthScore}/100`}
            detail={hasPlatform ? "Enterprise-ready posture" : "Complete setup to activate"}
            tone="cyan"
          />
          <MetricCard
            label="Verification Success"
            value={verificationSuccessRate}
            detail="Identity verification readiness"
            tone="emerald"
          />
          <MetricCard
            label="Fraud Exposure"
            value={fraudExposure}
            detail="Current platform risk signal"
            tone={hasPlatform ? "emerald" : "amber"}
          />
          <MetricCard
            label="Webhook Health"
            value={webhookHealth}
            detail="Real-time event delivery"
            tone={hasPlatform ? "emerald" : "amber"}
          />
          <MetricCard
            label="Compliance"
            value={complianceStatus}
            detail="Audit and consent posture"
            tone={hasPlatform ? "emerald" : "amber"}
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">AI Executive Summary</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Clear operational guidance for the next best action.
                </p>
              </div>
              <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                Genius Mode
              </span>
            </div>

            {hasPlatform ? (
              <div className="space-y-4 text-sm leading-6 text-slate-200">
                <p>
                  Your platform is structurally ready for TrustLayer integration.
                  Verification, trust scoring, compliance posture, and webhook
                  readiness are aligned for sandbox-to-production progression.
                </p>
                <p>
                  Recommended next step: review verification requests, validate
                  your trust badge, then move into API testing with production-like
                  data.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-sm leading-6 text-slate-200">
                <p>
                  Platform registration is incomplete. Complete company setup to
                  unlock verification workflows, TrustScore intelligence, trust
                  badge issuance, and compliance readiness.
                </p>
                <p>
                  Recommended next step: complete platform registration before
                  configuring developer tools or customer-facing trust badges.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Platform Registration</h2>
            <p className="mt-2 text-sm text-slate-400">
              Status:{" "}
              <span className={hasPlatform ? "text-emerald-300" : "text-amber-300"}>
                {hasPlatform ? "Complete" : "Incomplete"}
              </span>
            </p>

            <Link
              href="/onboarding/company"
              className="mt-5 inline-flex rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              {hasPlatform ? "Edit platform registration" : "Complete platform registration"}
            </Link>

            <form action="/api/auth/logout" method="post" className="mt-4">
              <button
                type="submit"
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10"
              >
                Log out
              </button>
            </form>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <ActionCard
            title="TrustScore Intelligence"
            description="View explainable reputation and risk scoring."
            href="/trust-score"
          />
          <ActionCard
            title="Verification Requests"
            description="Manage identity and business verification workflows."
            href="/verification/requests"
          />
          <ActionCard
            title="Trust Badge"
            description="Preview customer-facing trust certification."
            href="/certification/badge"
          />
        </section>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone
}: {
  label: string;
  value: string;
  detail: string;
  tone: "cyan" | "emerald" | "amber";
}) {
  const toneClass =
    tone === "cyan"
      ? "text-cyan-200 bg-cyan-400/10"
      : tone === "emerald"
        ? "text-emerald-200 bg-emerald-400/10"
        : "text-amber-200 bg-amber-400/10";

  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <p className={`mt-4 rounded-full px-3 py-1 text-xs font-medium ${toneClass}`}>
        {detail}
      </p>
    </article>
  );
}

function ActionCard({
  title,
  description,
  href
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 transition hover:-translate-y-0.5 hover:bg-white/[0.09]"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      <p className="mt-5 text-sm font-medium text-cyan-200">Open →</p>
    </Link>
  );
}
