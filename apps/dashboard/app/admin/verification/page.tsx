"use client";

import { useEffect, useMemo, useState } from "react";

type VerificationRequest = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 1100 }}>
      <p>
        <a href="/">Back to dashboard</a>
      </p>

      <h1>Admin Verification Console</h1>
      <p>
        Review submitted verification requests, move packages into review, and
        approve or reject them.
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

      {message ? <p style={{ marginTop: 16 }}>{message}</p> : null}

      <section style={{ marginTop: 32 }}>
        <h2>Review Queue</h2>

        {filteredRequests.length === 0 ? (
          <p>No verification requests found for this filter.</p>
        ) : (
          <div style={{ display: "grid", gap: 24 }}>
            {filteredRequests.map((request) => (
              <article
                key={request.id}
                style={{
                  border: "1px solid #ddd",
                  padding: 24
                }}
              >
                <h2><a href={`/admin/verification/${request.id}`}>{request.title}</a></h2>
                <p>
                  <strong>Status:</strong> {formatStatus(request.status)}
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(request.createdAt).toLocaleDateString()}
                </p>

                <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => updateStatus(request.id, "IN_REVIEW")}
                    style={{ padding: 10 }}
                  >
                    Mark In Review
                  </button>

                  <button
                    type="button"
                    onClick={() => updateStatus(request.id, "APPROVED")}
                    style={{ padding: 10 }}
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => updateStatus(request.id, "REJECTED")}
                    style={{ padding: 10 }}
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    onClick={() => updateStatus(request.id, "EXPIRED")}
                    style={{ padding: 10 }}
                  >
                    Expire
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
