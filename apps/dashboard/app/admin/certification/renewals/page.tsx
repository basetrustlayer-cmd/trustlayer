"use client";

import { useState } from "react";

type RenewalNotificationResult = {
  scanned: number;
  notificationsCreated: number;
  emailsQueued: number;
  notifications: Array<{
    notification: {
      id: string;
      action: string;
      notes: string | null;
      createdAt: string;
    };
    email: {
      id: string;
      action: string;
      notes: string | null;
      createdAt: string;
    };
  }>;
  error?: string;
};

export default function RenewalNotificationsPage() {
  const [result, setResult] = useState<RenewalNotificationResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function runScan() {
    setLoading(true);

    const response = await fetch("/api/admin/certification/renewal-notifications", {
      method: "POST"
    });

    const data = await response.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 960 }}>
      <p>
        <a href="/">Back to dashboard</a>
      </p>

      <h1>Certification Renewal Notifications</h1>
      <p>
        Scan approved verification records and create renewal notification audit
        events for credentials that are expired or within the renewal window.
      </p>

      <button type="button" onClick={runScan} disabled={loading} style={{ padding: 12 }}>
        {loading ? "Scanning..." : "Run renewal notification scan"}
      </button>

      {result ? (
        <section style={{ marginTop: 24, padding: 20, border: "1px solid #ddd" }}>
          {result.error ? (
            <p>{result.error}</p>
          ) : (
            <>
              <p>Approved records scanned: {result.scanned}</p>
              <p>Notifications created: {result.notificationsCreated}</p>
              <p>Emails queued: {result.emailsQueued}</p>

              {result.notifications.length ? (
                <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                  {result.notifications.map((item) => (
                    <article key={item.notification.id} style={{ border: "1px solid #ddd", padding: 12 }}>
                      <p>
                        <strong>{item.notification.action}</strong>
                      </p>
                      <p>{item.notification.notes}</p>
                      <p>{item.email.notes}</p>
                      <p>{new Date(item.notification.createdAt).toLocaleString()}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p>No new renewal notifications were needed.</p>
              )}
            </>
          )}
        </section>
      ) : null}
    </main>
  );
}
