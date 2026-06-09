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
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${bytes} bytes`;
}

function getDocumentHealth(documents: VerificationDocument[]) {
  if (!documents.length) return "No evidence uploaded";
  if (documents.some((doc) => doc.reviewStatus === "REJECTED")) return "Action required";
  if (documents.some((doc) => doc.reviewStatus === "NEEDS_RESUBMISSION")) return "Resubmission needed";
  if (documents.every((doc) => doc.reviewStatus === "APPROVED")) return "Evidence approved";
  return "Review in progress";
}

function getReviewPriority(request: VerificationRequest | null, documents: VerificationDocument[]) {
  if (!request) return "Unknown";
  if (request.status === "REJECTED") return "High";
  if (documents.some((doc) => doc.reviewStatus === "NEEDS_RESUBMISSION" || doc.reviewStatus === "REJECTED")) {
    return "High";
  }
  if (request.status === "SUBMITTED" || request.status === "IN_REVIEW") return "Medium";
  return "Normal";
}

export default function VerificationSubmissionPage() {
  const params = {
    id:
      typeof window !== "undefined"
        ? window.location.pathname.split("/").filter(Boolean).at(-1) ?? ""
        : ""
  };

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

    const response = await fetch(`/api/verification/requests/${params.id}/documents`, {
      method: "POST",
      body: formData
    });

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

    const response = await fetch(`/api/verification/requests/${params.id}/documents`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ documentId })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not delete document.");
      return;
    }

    setMessage("Document deleted.");
    await loadDetail();
  }

  const progress = request ? getProgress(request.status) : 0;

  const documentHealth = useMemo(() => getDocumentHealth(documents), [documents]);
  const reviewPriority = useMemo(
    () => getReviewPriority(request, documents),
    [request, documents]
  );

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <Link
          href="/verification/requests"
          className="text-sm font-medium text-cyan-200 hover:text-cyan-100"
        >
          ← Back to verification requests
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
            Verification Detail Command Center
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Evidence, review status, and verification readiness.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            Track supporting documents, review priority, request progress, and
            evidence quality from one operational workspace.
          </p>
        </div>

        {message ? (
          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-100">
            {message}
          </div>
        ) : null}

        {request ? (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-4">
              <MetricCard label="Request Status" value={formatStatus(request.status)} />
              <MetricCard label="Progress" value={`${progress}%`} />
              <MetricCard label="Document Health" value={documentHealth} />
              <MetricCard label="Review Priority" value={reviewPriority} />
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <h2 className="text-2xl font-semibold">{request.title}</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Created {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-200">
                    {formatStatus(request.status)}
                  </span>
                </div>

                <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                  <p>Updated: {new Date(request.updatedAt).toLocaleString()}</p>
                  <p>Evidence files: {documents.length}</p>
                </div>
              </article>

              <form
                onSubmit={uploadDocument}
                className="rounded-3xl border border-white/10 bg-white/[0.06] p-6"
              >
                <h2 className="text-xl font-semibold">Upload Supporting Document</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Add registration certificates, tax documents, ID files,
                  compliance documents, or other supporting evidence.
                </p>

                <input
                  name="file"
                  type="file"
                  required
                  className="mt-5 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-300 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
                />

                <button
                  type="submit"
                  disabled={uploading}
                  className="mt-4 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? "Uploading..." : "Upload document"}
                </button>
              </form>
            </section>

            <section className="mt-6">
              <h2 className="text-xl font-semibold">Uploaded Documents</h2>

              {documents.length ? (
                <div className="mt-4 grid gap-4">
                  {documents.map((document) => (
                    <article
                      key={document.id}
                      className="rounded-3xl border border-white/10 bg-white/[0.06] p-6"
                    >
                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <div>
                          <h3 className="text-lg font-semibold">{document.filename}</h3>
                          <p className="mt-2 text-sm text-slate-400">
                            {document.contentType} · {formatFileSize(document.sizeBytes)}
                          </p>
                        </div>

                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                          {formatStatus(document.reviewStatus)}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
                        <p>Uploaded: {new Date(document.createdAt).toLocaleString()}</p>
                        <p>
                          Reviewed:{" "}
                          {document.reviewedAt
                            ? new Date(document.reviewedAt).toLocaleString()
                            : "Pending"}
                        </p>
                        <p>Evidence status: {formatStatus(document.reviewStatus)}</p>
                      </div>

                      {document.reviewNotes ? (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
                          Reviewer notes: {document.reviewNotes}
                        </div>
                      ) : null}

                      <div className="mt-5 flex flex-wrap gap-3">
                        <a
                          href={document.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                        >
                          Download
                        </a>

                        {document.reviewStatus === "PENDING" ||
                        document.reviewStatus === "NEEDS_RESUBMISSION" ||
                        document.reviewStatus === "REJECTED" ? (
                          <button
                            type="button"
                            onClick={() => deleteDocument(document.id)}
                            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-sm text-slate-400">
                  No documents uploaded yet. Upload evidence to move this request toward review readiness.
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-sm text-slate-400">
            Verification request not found.
          </div>
        )}
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
    </article>
  );
}
