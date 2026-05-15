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

type VerificationDocument = {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  reviewStatus: string;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  downloadUrl: string;
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

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${bytes} bytes`;
}

export default function VerificationDetailPage({
  params
}: {
  params: { id: string };
}) {
  const [request, setRequest] = useState<VerificationRequestDetail | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notes, setNotes] = useState("");
  const [documentNotes, setDocumentNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function loadDetail() {
    const response = await fetch(`/api/admin/verification/${params.id}`);
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not load verification request.");
      return;
    }

    setRequest(data.request);
    setDocuments(data.documents || []);
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

  async function reviewDocument(documentId: string, reviewStatus: string) {
    setMessage("");

    const response = await fetch(
      `/api/admin/verification/${params.id}/documents/${documentId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reviewStatus,
          reviewNotes: documentNotes[documentId] || ""
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not review document.");
      return;
    }

    setDocumentNotes((current) => ({ ...current, [documentId]: "" }));
    setMessage(`Document marked as ${formatStatus(reviewStatus)}.`);
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
            <h2>Request Review Notes</h2>
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
                Approve Request
              </button>
              <button type="button" onClick={() => updateStatus("REJECTED")} style={{ padding: 10 }}>
                Reject Request
              </button>
              <button type="button" onClick={() => updateStatus("EXPIRED")} style={{ padding: 10 }}>
                Expire Request
              </button>
            </div>
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>Supporting Documents</h2>

            {documents.length ? (
              <div style={{ display: "grid", gap: 16 }}>
                {documents.map((document) => (
                  <article key={document.id} style={{ padding: 20, border: "1px solid #ddd" }}>
                    <h3>{document.filename}</h3>
                    <p>
                      <strong>Review Status:</strong> {formatStatus(document.reviewStatus)}
                    </p>
                    <p>
                      <strong>Size:</strong> {formatFileSize(document.sizeBytes)}
                    </p>
                    <p>
                      <strong>Uploaded:</strong>{" "}
                      {new Date(document.createdAt).toLocaleString()}
                    </p>
                    {document.reviewedAt ? (
                      <p>
                        <strong>Reviewed:</strong>{" "}
                        {new Date(document.reviewedAt).toLocaleString()}
                      </p>
                    ) : null}
                    {document.reviewNotes ? (
                      <p>
                        <strong>Review Notes:</strong> {document.reviewNotes}
                      </p>
                    ) : null}

                    <p>
                      <a href={document.downloadUrl} target="_blank" rel="noreferrer">
                        Download document
                      </a>
                    </p>

                    <textarea
                      value={documentNotes[document.id] || ""}
                      onChange={(event) =>
                        setDocumentNotes((current) => ({
                          ...current,
                          [document.id]: event.target.value
                        }))
                      }
                      placeholder="Add document review notes..."
                      style={{ width: "100%", minHeight: 90, padding: 12 }}
                    />

                    <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => reviewDocument(document.id, "APPROVED")}
                        style={{ padding: 10 }}
                      >
                        Approve Document
                      </button>
                      <button
                        type="button"
                        onClick={() => reviewDocument(document.id, "REJECTED")}
                        style={{ padding: 10 }}
                      >
                        Reject Document
                      </button>
                      <button
                        type="button"
                        onClick={() => reviewDocument(document.id, "NEEDS_RESUBMISSION")}
                        style={{ padding: 10 }}
                      >
                        Request Resubmission
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p>No supporting documents uploaded yet.</p>
            )}
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
