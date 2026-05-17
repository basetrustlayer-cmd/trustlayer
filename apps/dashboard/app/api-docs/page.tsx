const endpointGroups = [
  {
    title: "Verification & Trust Scores",
    description: "Verify subjects, inspect tiers, and retrieve role-based TrustScores.",
    items: [
      "POST /v1/verify",
      "GET /v1/tier/{subjectId}",
      "GET /v1/score/{subjectId}",
      "GET /v1/score/{subjectId}/history"
    ]
  },
  {
    title: "Marketplace Reputation",
    description: "Submit transactions, reviews, disputes, and inspect leaderboard rankings.",
    items: [
      "POST /v1/transactions",
      "POST /v1/reviews",
      "POST /v1/disputes",
      "GET /v1/leaderboard"
    ]
  },
  {
    title: "Fraud & Monitoring",
    description: "Inspect fraud graph risk, fraud alerts, and event processing state.",
    items: [
      "GET /v1/fraud-graph/{subjectId}/risk",
      "GET /v1/fraud-alerts",
      "GET /v1/fraud-alerts/{id}",
      "POST /v1/fraud-alerts/{id}/resolve",
      "GET /v1/events",
      "GET /v1/events/{eventId}",
      "POST /v1/events/{eventId}/reprocess"
    ]
  },
  {
    title: "Wallet & Escrow",
    description: "Manage wallet accounts, ledger postings, and escrow lifecycle.",
    items: [
      "POST /v1/wallet/accounts",
      "GET /v1/wallet/accounts/{id}/balance",
      "POST /v1/wallet/transactions",
      "POST /v1/escrow/holds",
      "POST /v1/escrow/{reference}/release",
      "POST /v1/escrow/{reference}/cancel"
    ]
  },
  {
    title: "Dispute Resolution & Notifications",
    description: "Open dispute-resolution cases, submit evidence, resolve cases, and notify parties.",
    items: [
      "POST /v1/dispute-resolution/disputes",
      "GET /v1/dispute-resolution/disputes/{id}",
      "POST /v1/dispute-resolution/disputes/{id}/evidence",
      "POST /v1/dispute-resolution/disputes/{id}/resolve",
      "POST /v1/notifications/send"
    ]
  },
  {
    title: "API Keys, Billing & Stripe",
    description: "Manage API keys, plans, subscriptions, and Stripe customer flows.",
    items: [
      "POST /v1/api-keys",
      "GET /v1/platforms/{platformId}/api-keys",
      "POST /v1/api-keys/revoke",
      "POST /v1/billing/plans",
      "POST /v1/billing/subscriptions",
      "POST /v1/billing/stripe/checkout",
      "POST /v1/billing/stripe/portal",
      "POST /v1/billing/stripe/webhook"
    ]
  }
];

const swaggerUrl =
  "https://petstore.swagger.io/?url=https://raw.githubusercontent.com/basetrustlayer-cmd/trustlayer/main/api-spec/openapi.yaml";

const redocUrl =
  "https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/basetrustlayer-cmd/trustlayer/main/api-spec/openapi.yaml";

export default function ApiDocsPage() {
  return (
    <main
      style={{
        padding: 40,
        fontFamily: "Arial, sans-serif",
        maxWidth: 1180,
        margin: "0 auto",
        color: "#111827"
      }}
    >
      <p>
        <a href="/">← Back to dashboard</a>
      </p>

      <section
        style={{
          padding: 28,
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          background: "#f9fafb"
        }}
      >
        <p style={{ margin: 0, color: "#4b5563", fontWeight: 700 }}>
          Developer Portal
        </p>
        <h1 style={{ marginBottom: 12 }}>TrustLayer API Docs</h1>
        <p style={{ fontSize: 18, lineHeight: 1.6, maxWidth: 820 }}>
          Interactive reference for the TrustLayer verification, TrustScore,
          fraud, wallet, escrow, dispute, notification, billing, and webhook
          APIs.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
          <a
            href="/api/openapi"
            target="_blank"
            rel="noreferrer"
            style={buttonStyle}
          >
            Download OpenAPI YAML
          </a>
          <a href={swaggerUrl} target="_blank" rel="noreferrer" style={buttonStyle}>
            Open in Swagger UI
          </a>
          <a href={redocUrl} target="_blank" rel="noreferrer" style={buttonStyle}>
            Open in Redoc
          </a>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>Endpoint Groups</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16
          }}
        >
          {endpointGroups.map((section) => (
            <article
              key={section.title}
              style={{
                padding: 20,
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                background: "#ffffff"
              }}
            >
              <h3 style={{ marginTop: 0 }}>{section.title}</h3>
              <p style={{ color: "#4b5563", lineHeight: 1.5 }}>
                {section.description}
              </p>
              <ul style={{ paddingLeft: 20 }}>
                {section.items.map((item) => (
                  <li key={item} style={{ marginBottom: 8 }}>
                    <code>{item}</code>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section style={panelStyle}>
        <h2>Authentication</h2>
        <p>
          Most <code>/v1/*</code> routes require an API key using the{" "}
          <code>X-API-Key</code> header. Stripe webhook routes are public and
          verified by Stripe signature.
        </p>
      </section>

      <section style={panelStyle}>
        <h2>Example Request</h2>
        <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto" }}>
{`curl -X POST https://api.trustlayer.io/v1/verify \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: tl_live_..." \\
  -d '{"subjectId":"sub_123","method":"GHANA_CARD","nationalId":"***"}'`}
        </pre>
      </section>
    </main>
  );
}

const buttonStyle = {
  display: "inline-block",
  padding: "10px 14px",
  border: "1px solid #111827",
  borderRadius: 10,
  color: "#111827",
  textDecoration: "none",
  background: "#ffffff",
  fontWeight: 700
};

const panelStyle = {
  marginTop: 28,
  padding: 20,
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  background: "#ffffff"
};
