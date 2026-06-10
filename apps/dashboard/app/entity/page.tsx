import Link from "next/link";
import {
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
  TrustScoreCard
} from "@/components/trustlayer";
import {
  getTrustBadgeByEntityId,
  getTrustProfileByEntityId,
  getVerificationRequestsByEntityId
} from "../../../../packages/shared-types/src/repositories";

const entityId = "entity_001";

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
    href: "/vendors/entity_001"
  }
];

export default function EntityPortalHomePage() {
  const profile = getTrustProfileByEntityId(entityId);
  const badge = getTrustBadgeByEntityId(entityId);
  const verifications = getVerificationRequestsByEntityId(entityId);
  const approvedVerification = verifications.some(
    (verification) => verification.status === "APPROVED"
  );

  const entityProgress = [
    { label: "Create Trust Entity", complete: Boolean(profile) },
    { label: "Verify Identity", complete: approvedVerification },
    { label: "Upload Evidence", complete: verifications.length > 0 },
    { label: "Generate TrustScore", complete: Boolean(profile?.trustScore) },
    { label: "Publish Trust Badge", complete: badge?.status === "ACTIVE" }
  ];

  const completedSteps = entityProgress.filter((step) => step.complete).length;
  const progress = Math.round((completedSteps / entityProgress.length) * 100);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm font-medium text-cyan-200 hover:text-cyan-100">
          ← Back to Trust Center
        </Link>

        <div className="mt-6">
          <PageHeader
            eyebrow="Trust Entity Portal"
            title="Build trust before every transaction."
            description="This free portal helps individuals and businesses generate a TrustScore, verify their identity, publish a trust badge, and improve customer confidence. The same entity may act as a buyer in one transaction and a seller in another, but seller-side verification is emphasized because it is usually the highest counterparty-risk role."
          />
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <StatCard
            label="TrustScore"
            value={profile ? `${profile.trustScore}/100` : "Pending"}
            detail={profile?.band ?? "Awaiting score"}
          />
          <StatCard label="Entity Type" value="Individual" detail="Can act as buyer or seller" />
          <StatCard
            label="Verification"
            value={approvedVerification ? "Approved" : "Pending"}
            detail="Seller-side ready"
          />
          <StatCard
            label="Badge"
            value={badge?.status ?? "Pending"}
            detail={badge ? badge.badgeLabel : "Complete verification first"}
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionCard
            title="Trust Readiness"
            description="Complete these steps to increase trust and publish your reputation."
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-slate-400">Overall completion</p>
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
                  <StatusBadge color={step.complete ? "emerald" : "amber"}>
                    {step.complete ? "Complete" : "Next"}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </SectionCard>

          {profile ? (
            <TrustScoreCard
              score={profile.trustScore}
              band={profile.band}
              confidence={profile.confidence}
              verificationTier={profile.verificationTier}
            />
          ) : (
            <SectionCard title="TrustScore Pending">
              <p className="text-sm leading-6 text-slate-300">
                Complete verification to generate your first TrustScore.
              </p>
            </SectionCard>
          )}
        </section>

        <section className="mt-6">
          <SectionCard title="Next Best Actions">
            <div className="grid gap-4">
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
          </SectionCard>
        </section>

        <section className="mt-6">
          <SectionCard title="Free Entity Access">
            <p className="max-w-3xl text-sm leading-6 text-slate-300">
              Trust entities do not need a paid trial. Individuals and businesses can
              maintain a free trust profile because every verified entity strengthens
              the TrustLayer network. Paid plans are reserved for integrators who use
              TrustLayer through APIs, SDKs, webhooks, and embedded trust signaling.
            </p>
          </SectionCard>
        </section>
      </section>
    </main>
  );
}
