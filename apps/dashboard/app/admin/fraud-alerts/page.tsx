"use client";

import { useEffect, useMemo, useState } from "react";

type FraudAlert = {
  id: string;
  subjectId: string;
  severity: string;
  status: string;
  reason: string;
  source: string;
  metadata?: unknown;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function AdminFraudAlertsPage() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [status, setStatus] = useState("OPEN");
  const [severity, setSeverity] = useState("ALL");
  const [message, setMessage] = useState("");

  async function loadAlerts() {
    const params = new URLSearchParams();

    if (status !== "ALL") {
      params.set("status", status);
    }

    if (severity !== "ALL") {
      params.set("severity", severity);
    }

    const response = await fetch(`/api/fraud-alerts?${params.toString()}`);
    const data = await response.json();

    setAlerts(data.alerts || []);
  }

  useEffect(() => {
    loadAlerts();
  }, [status, severity]);

  const counts = useMemo(() => {
    return alerts.reduce<Record<string, number>>(
      (acc, alert) => {
        acc.ALL += 1;
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      },
      { ALL: 0 }
    );
  }, [alerts]);

  async function resolveAlert(id: string) {
    setMessage("");

    const response = await fetch(`/api/fraud-alerts/${id}/resolve`, {
      method: "POST"
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Failed to resolve fraud alert.");
      return;
    }

    setMessage("Fraud alert resolved.");
    await loadAlerts();
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 1200 }}>
      <p>
        <a href="/">Back to dashboard</a>
      </p>

      <h1>Fraud Case Management</h1>
      <p>
        Review high-risk fraud alerts, inspect alert source metadata, and resolve
        cleared cases.
      </p>

      <section
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12
        }}
      >
        {["ALL", "LOW", "MEDIUM", "HIGH"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setSeverity(item)}
            style={{
              padding: 14,
              border: "1px solid #ddd",
              background: severity === item ? "#111" : "#fff",
              color: severity === item ? "#fff" : "#111",
              textAlign: "left"
            }}
          >
            <strong>{formatLabel(item)}</strong>
            <br />
            {counts[item] || 0}
          </button>
        ))}
      </section>

      <section style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
        {["OPEN", "RESOLVED", "ALL"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setStatus(item)}
            style={{
              padding: 10,
              border: "1px solid #ddd",
              background: status === item ? "#111" : "#fff",
              color: status === item ? "#fff" : "#111"
            }}
          >
            {formatLabel(item)}
          </button>
        ))}
      </section>

      {message ? <p style={{ marginTop: 16 }}>{message}</p> : null}

      <section style={{ marginTop: 32 }}>
        <h2>Investigation Queue</h2>

        {alerts.length === 0 ? (
          <p>No fraud alerts found for this filter.</p>
        ) : (
          <div style={{ display: "grid", gap: 24 }}>
            {alerts.map((alert) => (
              <article
                key={alert.id}
                style={{
                  border: "1px solid #ddd",
                  padding: 24
                }}
              >
                <h2>{alert.reason}</h2>

                <p>
                  <strong>Subject:</strong> {alert.subjectId}
                </p>
                <p>
                  <strong>Severity:</strong> {formatLabel(alert.severity)} |{" "}
                  <strong>Status:</strong> {formatLabel(alert.status)} |{" "}
                  <strong>Source:</strong> {formatLabel(alert.source)}
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(alert.createdAt).toLocaleString()}
                </p>

                {alert.metadata ? (
                  <details style={{ marginTop: 12 }}>
                    <summary>Metadata</summary>
                    <pre
                      style={{
                        background: "#f7f7f7",
                        padding: 12,
                        overflowX: "auto"
                      }}
                    >
                      {JSON.stringify(alert.metadata, null, 2)}
                    </pre>
                  </details>
                ) : null}

                {alert.status !== "RESOLVED" ? (
                  <button
                    type="button"
                    onClick={() => resolveAlert(alert.id)}
                    style={{ padding: 10, marginTop: 16 }}
                  >
                    Resolve Alert
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
