"use client";

import { useEffect, useState } from "react";

type VerificationRequest = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
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

  async function loadRequests() {
    const response = await fetch("/api/admin/verification");
    const data = await response.json();
    setRequests(data.requests || []);
  }

  useEffect(() => {
    loadRequests();
  }, []);

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
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 960 }}>
      <h1>Admin Verification Console</h1>
      <p>Review identity verification requests.</p>

      {message ? <p style={{ marginTop: 16 }}>{message}</p> : null}

      <section style={{ marginTop: 32 }}>
        {requests.length === 0 ? (
          <p>No verification requests found.</p>
        ) : (
          <div style={{ display: "grid", gap: 24 }}>
            {requests.map((request) => (
              <article
                key={request.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 24
                }}
              >
                <h2>{request.title}</h2>
                <p><strong>Status:</strong> {formatStatus(request.status)}</p>

                <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
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
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p style={{ marginTop: 24 }}>
        <a href="/">Back to dashboard</a>
      </p>
    </main>
  );
}
