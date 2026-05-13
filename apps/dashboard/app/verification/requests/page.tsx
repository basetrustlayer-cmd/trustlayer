"use client";

import { useEffect, useState } from "react";

type VerificationRequest = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const nextActions: Record<string, { label: string; status: string } | null> = {
  DRAFT: { label: "Submit for review", status: "SUBMITTED" },
  SUBMITTED: { label: "Start review", status: "IN_REVIEW" },
  IN_REVIEW: { label: "Approve", status: "APPROVED" },
  APPROVED: { label: "Mark expired", status: "EXPIRED" },
  REJECTED: { label: "Return to draft", status: "DRAFT" },
  EXPIRED: { label: "Resubmit", status: "SUBMITTED" }
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function VerificationRequestsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [status, setStatus] = useState("");

  async function loadRequests() {
    const response = await fetch("/api/verification/requests");
    const data = await response.json();
    setRequests(data.requests || []);
  }

  useEffect(() => {
    loadRequests();
  }, []);

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
      setStatus("Could not create verification request.");
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

    if (!response.ok) {
      const data = await response.json();
      setStatus(data.error || "Could not update verification request.");
      return;
    }

    setStatus("Verification request updated.");
    await loadRequests();
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 900 }}>
      <h1>Verification Requests</h1>
      <p>
        Create and manage verification packages for customers, buyers, lenders,
        and marketplace counterparties.
      </p>

      <form onSubmit={handleCreate} style={{ display: "grid", gap: 12, marginTop: 24 }}>
        <input
          name="title"
          placeholder="Example: Supplier onboarding verification"
          required
          style={{ padding: 12 }}
        />
        <button type="submit" style={{ padding: 12 }}>Create verification request</button>
      </form>

      {status ? <p style={{ marginTop: 16 }}>{status}</p> : null}

      <section style={{ marginTop: 32 }}>
        <h2>Requests</h2>

        {requests.length === 0 ? (
          <p>No verification requests created yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {requests.map((request) => {
              const action = nextActions[request.status];

              return (
                <article key={request.id} style={{ border: "1px solid #ddd", padding: 16 }}>
                  <h3>{request.title}</h3>
                  <p>Status: {formatStatus(request.status)}</p>
                  <p>Created: {new Date(request.createdAt).toLocaleDateString()}</p>

                  {action ? (
                    <button
                      type="button"
                      onClick={() => updateStatus(request.id, action.status)}
                      style={{ padding: 10 }}
                    >
                      {action.label}
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <p style={{ marginTop: 24 }}><a href="/">Back to dashboard</a></p>
    </main>
  );
}
