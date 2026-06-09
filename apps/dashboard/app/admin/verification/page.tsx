"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type VerificationRequest = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
};

const filters = ["ALL", "SUBMITTED", "IN_REVIEW", "APPROVED", "REJECTED", "EXPIRED", "DRAFT"];

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getPriority(status: string) {
  if (status === "SUBMITTED") return "Needs triage";
  if (status === "IN_REVIEW") return "Active review";
  if (status === "REJECTED") return "Decisioned";
  if (status === "APPROVED") return "Approved";
  if (status === "EXPIRED") return "Expired";
  return "Low";
}

export default function AdminVerificationPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("ALL");

  async function loadRequests() {
    const response = await fetch("/api/admin/verification");
    const data = await response.json();
    setRequests(data.requests || []);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    return filter === "ALL"
      ? requests
      : requests.filter((request) => request.status === filter);
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

  async function updateStatus(id: string, status: string) {
    setMessage("");

    const response = await fetch("/api/admin/verification", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id, status })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Failed to update request.");
      return;
    }

    setMessage(`Request marked as ${formatStatus(status)}.`);
    await loadRequests();
  }

  const submittedCount = counts.SUBMITTED || 0;
  const inReviewCount = counts.IN_REVIEW || 0;
  const completedCount = (counts.APPROVED || 0) + (counts.REJECTED || 0);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm font-medium text-cyan-200 hover:text-cyan-100">
          ← Back to Trust Center
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            Verification Review Console
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Operate the trust review queue.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            Review submitted verification packages, move them into review, approve
            trusted evidence, reject insufficient evidence, and maintain an auditable
            verification lifecycle.
          </p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <MetricCard label="Total Queue" value={String(counts.ALL || 0)} />
          <MetricCard label="Needs Triage" value={String(submittedCount)} />
          <MetricCard label="In Review" value={String(inReviewCount)} />
          <MetricCard label="Completed" value={String(completedCount)} />
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-4 xl:grid-cols-7">
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

        {message ? (
          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-100">
            {message}
          </div>
        ) : null}

        <section className="mt-6">
          <h2 className="text-xl font-semibold">Review Queue</h2>

          {filteredRequests.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-sm text-slate-400">
              No verification requests found for this filter.
            </div>
          ) : (
            <div className="mt-4 grid gap-4">
              {filteredRequests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.06] p-6"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <Link
                        href={`/admin/verification/${request.id}`}
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

                  <div className="mt-5 grid gap-2 text-sm text-slate-400 md:grid-cols-2">
                    <p>Created: {new Date(request.createdAt).toLocaleDateString()}</p>
                    <p>
                      Updated:{" "}
                      {request.updatedAt
                        ? new Date(request.updatedAt).toLocaleDateString()
                        : "Not available"}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/admin/verification/${request.id}`}
                      className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                    >
                      Open Review
                    </Link>

                    <button
                      type="button"
                      onClick={() => updateStatus(request.id, "IN_REVIEW")}
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                    >
                      Mark In Review
                    </button>

                    <button
                      type="button"
                      onClick={() => updateStatus(request.id, "APPROVED")}
                      className="rounded-xl border border-emerald-300/20 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-300/10"
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={() => updateStatus(request.id, "REJECTED")}
                      className="rounded-xl border border-red-300/20 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-300/10"
                    >
                      Reject
                    </button>

                    <button
                      type="button"
                      onClick={() => updateStatus(request.id, "EXPIRED")}
                      className="rounded-xl border border-amber-300/20 px-4 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-300/10"
                    >
                      Expire
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </article>
  );
}
