"use client";

import { useEffect, useState } from "react";

type VerificationRequest = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
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

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${bytes} bytes`;
}

export default function VerificationSubmissionPage({
  params
}: {
  params: { id: string };
}) {
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function loadDetail() {
    const requestsResponse = await fetch("/api/verification/requests");
    const requestsData = await requestsResponse.json();

    const currentRequest = (requestsData.requests || []).find(
      (item: VerificationRequest) => item.id === params.id
    );

    setRequest(currentRequest || null);

    const documentsResponse = await fetch(
      `/api/verification/requests/${params.id}/documents`
    );
    const documentsData = await documentsResponse.json();

    if (!documentsResponse.ok) {
      setMessage(documentsData.error || "Could not load documents.");
      return;
    }

    setDocuments(documentsData.documents || []);
  }

  useEffect(() => {
    loadDetail();
  }, []);

  async function uploadDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setUploading(true);

    const formData = new FormData(event.currentTarget);

    const response = await fetch(
      `/api/verification/requests/${params.id}/documents`,
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();
    setUploading(false);

    if (!response.ok) {
      setMessage(data.error || "Could not upload document.");
      return;
    }

    event.currentTarget.reset();
    setMessage("Document uploaded successfully.");
    await loadDetail();
  }

  async function deleteDocument(documentId: string) {
    setMessage("");

    const response = await fetch(
      `/api/verification/requests/${params.id}/documents`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ documentId })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not delete document.");
      return;
    }

    setMessage("Document deleted.");
    await loadDetail();
  }

  const progress = request ? getProgress(request.status) : 0;

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 1100 }}>
      <p>
        <a href="/verification/requests">Back to verification requests</a>
      </p>

      <h1>Verification Submission</h1>

      {message ? <p style={{ marginTop: 16 }}>{message}</p> : null}

      {request ? (
        <>
          <section style={{ marginTop: 24, padding: 24, border: "1px solid #ddd" }}>
            <h2>{request.title}</h2>
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
              <strong>Created:</strong>{" "}
              {new Date(request.createdAt).toLocaleString()}
            </p>
            <p>
              <strong>Updated:</strong>{" "}
              {new Date(request.updatedAt).toLocaleString()}
            </p>
          </section>

          <section style={{ marginTop: 24, padding: 24, border: "1px solid #ddd" }}>
            <h2>Upload Supporting Document</h2>
            <p>
              Upload registration certificates, tax documents, ID files,
              compliance documents, or other supporting evidence.
            </p>

            <form onSubmit={uploadDocument} style={{ display: "grid", gap: 12 }}>
              <input name="file" type="file" required style={{ padding: 12 }} />
              <button type="submit" disabled={uploading} style={{ padding: 12 }}>
                {uploading ? "Uploading..." : "Upload document"}
              </button>
            </form>
          </section>

          <section style={{ marginTop: 24 }}>
            <h2>Uploaded Documents</h2>

            {documents.length ? (
              <div style={{ display: "grid", gap: 16 }}>
                {documents.map((document) => (
                  <article key={document.id} style={{ padding: 20, border: "1px solid #ddd" }}>
                    <h3>{document.filename}</h3>
                    <p>
                      <strong>Review Status:</strong>{" "}
                      {formatStatus(document.reviewStatus)}
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
                        <strong>Reviewer Notes:</strong> {document.reviewNotes}
                      </p>
                    ) : null}

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <a href={document.downloadUrl} target="_blank" rel="noreferrer">
                        Download
                      </a>

                      {document.reviewStatus === "PENDING" ||
                      document.reviewStatus === "NEEDS_RESUBMISSION" ||
                      document.reviewStatus === "REJECTED" ? (
                        <button
                          type="button"
                          onClick={() => deleteDocument(document.id)}
                          style={{ padding: 8 }}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p>No documents uploaded yet.</p>
            )}
          </section>
        </>
      ) : (
        <p>Verification request not found.</p>
      )}
    </main>
  );
}
