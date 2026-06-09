"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type VerificationRequest = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const filters = ["ALL", "DRAFT", "SUBMITTED", "IN_REVIEW", "APPROVED", "REJECTED", "EXPIRED"];

const nextActions: Record<string, { label: string; status: string } | null> = {
  DRAFT: { label: "Submit for review", status: "SUBMITTED" },
  SUBMITTED: null,
  IN_REVIEW: null,
  APPROVED: { label: "Mark expired", status: "EXPIRED" },
  REJECTED: { label: "Return to draft", status: "DRAFT" },
  EXPIRED: { label: "Resubmit", status: "SUBMITTED" }
};

function formatStatus(status: string) {
  return status.toLowerCase().split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function getProgress(status: string) {
  const order = ["DRAFT", "SUBMITTED", "IN_REVIEW", "APPROVED"];
  const index = order.indexOf(status);
  if (status === "REJECTED") return 50;
  if (status === "EXPIRED") return 100;
  if (index < 0) return 0;
  return Math.round(((index + 1) / order.length) * 100);
}

function getPriority(status: string) {
  if (status === "REJECTED") return "Needs attention";
  if (status === "SUBMITTED" || status === "IN_REVIEW") return "In review";
  if (status === "APPROVED") return "Verified";
  if (status === "EXPIRED") return "Renewal needed";
  return "Draft";
}

export default function VerificationRequestsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState("ALL");

  async function loadRequests() {
    const response = await fetch("/api/verification/requests");
    const data = await response.json();
    setRequests(data.requests || []);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    return filter === "ALL" ? requests : requests.filter((request) => request.status === filter);
  }, [filter, requests]);

  const counts = useMemo(() => {
    return requests.reduce<Record<string, number>>(
      (acc, request) => {
        acc.ALL += 1;
        acc[request.status] = (acc[request.status] || 0) + 1;
        return acc;
      },
      { ALL: 0 }
    );
  }, [requests]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") || "");

    const response = await fetch("/api/verification/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Could not create verification request.");
      return;
    }

    event.currentTarget.reset();
    setStatus("Verification request created.");
    await loadRequests();
  }

  async function updateStatus(id: string, nextStatus: string) {
    setStatus("");

    const response = await fetch("/api/verification/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: nextStatus })
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Could not update verification request.");
      return;
    }

    setStatus("Verification request updated.");
    await loadRequests();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm font-medium text-cyan-200 hover:text-cyan-100">
          ← Back to Trust Center
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            Verification Command Center
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Govern every verification workflow.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            Create, submit, track, and prioritize verification packages for customers,
            vendors, lenders, sellers, workers, and counterparties.
          </p>
        </div>

        <section className="mt-8 grid gap-3 md:grid-cols-4 xl:grid-cols-7">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={[
                "rounded-2xl border p-4 text-left transition",
                filter === item
                  ? "border-cyan-300 bg-cyan-300 text-slate-950"
                  : "border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
              ].join(" ")}
            >
              <span className="text-sm font-semibold">{formatStatus(item)}</span>
              <span className="mt-2 block text-2xl font-bold">{counts[item] || 0}</span>
            </button>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <form
            onSubmit={handleCreate}
            className="rounded-3xl border border-white/10 bg-white/[0.06] p-6"
          >
            <h2 className="text-xl font-semibold">Create Verification Request</h2>
            <p className="mt-2 text-sm text-slate-400">
              Start a new verification package with a clear business purpose.
            </p>

            <input
              name="title"
              placeholder="Example: Supplier onboarding verification"
              required
              className="mt-5 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
            />

            <button
              type="submit"
              className="mt-4 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              Create verification request
            </button>

            {status ? (
              <p className="mt-4 rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-300">
                {status}
              </p>
            ) : null}
          </form>

          <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <h2 className="text-xl font-semibold">Review Queue Intelligence</h2>
            <p className="mt-2 text-sm text-slate-400">
              Prioritize rejected, expired, and in-review requests before they block onboarding.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <QueueMetric label="Needs attention" value={counts.REJECTED || 0} />
              <QueueMetric label="In review" value={(counts.SUBMITTED || 0) + (counts.IN_REVIEW || 0)} />
              <QueueMetric label="Approved" value={counts.APPROVED || 0} />
            </div>
          </section>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">Requests</h2>

          {filteredRequests.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-sm text-slate-400">
              No verification requests found for this filter.
            </div>
          ) : (
            <div className="mt-4 grid gap-4">
              {filteredRequests.map((request) => {
                const action = nextActions[request.status];
                const progress = getProgress(request.status);

                return (
                  <article
                    key={request.id}
                    className="rounded-3xl border border-white/10 bg-white/[0.06] p-6"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <Link
                          href={`/verification/requests/${request.id}`}
                          className="text-lg font-semibold text-white hover:text-cyan-200"
                        >
                          {request.title}
                        </Link>
                        <p className="mt-2 text-sm text-slate-400">
                          Priority: {getPriority(request.status)}
                        </p>
                      </div>

                      <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-200">
                        {formatStatus(request.status)}
                      </span>
                    </div>

                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-cyan-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-slate-400 md:grid-cols-2">
                      <p>Created: {new Date(request.createdAt).toLocaleDateString()}</p>
                      <p>Updated: {new Date(request.updatedAt).toLocaleDateString()}</p>
                    </div>

                    {action ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(request.id, action.status)}
                        className="mt-5 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                      >
                        {action.label}
                      </button>
                    ) : (
                      <p className="mt-5 text-sm text-slate-500">
                        No customer-side action available.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function QueueMetric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </article>
  );
}
