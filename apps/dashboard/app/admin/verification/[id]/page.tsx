"use client";

import { useEffect, useState } from "react";

type VerificationRequestDetail = {
  id: string;
  title: string;
  status: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  organization?: {
    name: string;
    slug: string;
  };
};

type AuditLog = {
  id: string;
  action: string;
  notes: string | null;
  metadata: unknown;
  createdAt: string;
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function VerificationDetailPage({
  params
}: {
  params: { id: string };
}) {
  const [request, setRequest] = useState<VerificationRequestDetail | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  async function loadDetail() {
    const response = await fetch(`/api/admin/verification/${params.id}`);
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not load verification request.");
      return;
    }

    setRequest(data.request);
    setAuditLogs(data.auditLogs || []);
  }

  useEffect(() => {
    loadDetail();
  }, []);

  async function updateStatus(status: string) {
    setMessage("");

    const response = await fetch(`/api/admin/verification/${params.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status, notes })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not update verification request.");
      return;
    }

    setNotes("");
    setMessage(`Request marked as ${formatStatus(status)}.`);
    setRequest(data.request);
    await loadDetail();
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 1100 }}>
      <p>
        <a href="/admin/verification">Back to admin verification</a>
      </p>

      <h1>Verification Detail</h1>

      {message ? <p style={{ marginTop: 16 }}>{message}</p> : null}

      {request ? (
        <>
          <section style={{ marginTop: 24, padding: 24, border: "1px solid #ddd" }}>
            <h2>{request.title}</h2>
            <p>
              <strong>Status:</strong> {formatStatus(request.status)}
            </p>
            <p>
              <strong>Organization:</strong>{" "}
              {request.organization?.name || request.organizationId}
            </p>
            <p>
              <strong>Created:</strong>{" "}
              {new Date(request.createdAt).toLocaleString()}
            </p>
            <p>
              <strong>Updated:</strong>{" "}
              {new Date(request.updatedAt).toLocaleString()}
            </p>
          </section>

          <section style={{ marginTop: 24, padding: 24, border: "1px solid #ddd" }}>
            <h2>Review Notes</h2>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add approval, rejection, or review notes..."
              style={{ width: "100%", minHeight: 120, padding: 12 }}
            />

            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              <button type="button" onClick={() => updateStatus("IN_REVIEW")} style={{ padding: 10 }}>
                Mark In Review
              </button>
              <button type="button" onClick={() => updateStatus("APPROVED")} style={{ padding: 10 }}>
                Approve
              </button>
              <button type="button" onClick={() => updateStatus("REJECTED")} style={{ padding: 10 }}>
                Reject
              </button>
              <button type="button" onClick={() => updateStatus("EXPIRED")} style={{ padding: 10 }}>
                Expire
              </button>
            </div>
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>Audit Trail</h2>

            {auditLogs.length ? (
              <div style={{ display: "grid", gap: 12 }}>
                {auditLogs.map((log) => (
                  <article key={log.id} style={{ padding: 16, border: "1px solid #ddd" }}>
                    <p>
                      <strong>{log.action}</strong>
                    </p>
                    <p>{log.notes || "No notes provided."}</p>
                    <p>{new Date(log.createdAt).toLocaleString()}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p>No audit logs yet.</p>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
