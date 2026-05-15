"use client";

import { useEffect, useMemo, useState } from "react";

type VerificationRequest = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const nextActions: Record<string, { label: string; status: string } | null> = {
  DRAFT: { label: "Submit for review", status: "SUBMITTED" },
  SUBMITTED: null,
  IN_REVIEW: null,
  APPROVED: { label: "Mark expired", status: "EXPIRED" },
  REJECTED: { label: "Return to draft", status: "DRAFT" },
  EXPIRED: { label: "Resubmit", status: "SUBMITTED" }
};

const statusOrder = ["DRAFT", "SUBMITTED", "IN_REVIEW", "APPROVED"];

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getProgress(status: string) {
  const index = statusOrder.indexOf(status);

  if (status === "REJECTED") return 50;
  if (status === "EXPIRED") return 100;
  if (index < 0) return 0;

  return Math.round(((index + 1) / statusOrder.length) * 100);
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
    if (filter === "ALL") {
      return requests;
    }

    return requests.filter((request) => request.status === filter);
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
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title })
    });

    if (!response.ok) {
      const data = await response.json();
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
      headers: {
        "Content-Type": "application/json"
      },
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
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 1100 }}>
      <p>
        <a href="/">Back to dashboard</a>
      </p>

      <h1>Verification Management</h1>
      <p>
        Create, submit, and track verification packages for customers, vendors,
        lenders, marketplace sellers, workers, and counterparties.
      </p>

      <section
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12
        }}
      >
        {["ALL", "DRAFT", "SUBMITTED", "IN_REVIEW", "APPROVED", "REJECTED", "EXPIRED"].map(
          (item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              style={{
                padding: 14,
                border: "1px solid #ddd",
                background: filter === item ? "#111" : "#fff",
                color: filter === item ? "#fff" : "#111",
                textAlign: "left"
              }}
            >
              <strong>{formatStatus(item)}</strong>
              <br />
              {counts[item] || 0}
            </button>
          )
        )}
      </section>

      <form
        onSubmit={handleCreate}
        style={{
          display: "grid",
          gap: 12,
          marginTop: 32,
          padding: 20,
          border: "1px solid #ddd"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Create Verification Request</h2>
        <input
          name="title"
          placeholder="Example: Supplier onboarding verification"
          required
          style={{ padding: 12 }}
        />
        <button type="submit" style={{ padding: 12 }}>
          Create verification request
        </button>
      </form>

      {status ? <p style={{ marginTop: 16 }}>{status}</p> : null}

      <section style={{ marginTop: 32 }}>
        <h2>Requests</h2>

        {filteredRequests.length === 0 ? (
          <p>No verification requests found for this filter.</p>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {filteredRequests.map((request) => {
              const action = nextActions[request.status];
              const progress = getProgress(request.status);

              return (
                <article
                  key={request.id}
                  style={{
                    border: "1px solid #ddd",
                    padding: 20
                  }}
                >
                  <h3><a href={`/verification/requests/${request.id}`}>{request.title}</a></h3>
                  <p>
                    <strong>Status:</strong> {formatStatus(request.status)}
                  </p>

                  <div
                    style={{
                      height: 10,
                      border: "1px solid #ddd",
                      maxWidth: 520,
                      marginBottom: 12
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${progress}%`,
                        background: "#111"
                      }}
                    />
                  </div>

                  <p>
                    Created: {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                  <p>
                    Updated: {new Date(request.updatedAt).toLocaleDateString()}
                  </p>

                  {action ? (
                    <button
                      type="button"
                      onClick={() => updateStatus(request.id, action.status)}
                      style={{ padding: 10 }}
                    >
                      {action.label}
                    </button>
                  ) : (
                    <p>No customer-side action available.</p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
