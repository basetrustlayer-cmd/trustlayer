const sections = [
  {
    title: "Verification",
    items: [
      "POST /v1/verify",
      "GET /v1/tier/{subjectId}"
    ]
  },
  {
    title: "Trust Scores",
    items: [
      "GET /v1/score/{subjectId}",
      "GET /v1/score/{subjectId}/history"
    ]
  },
  {
    title: "Marketplace Events",
    items: [
      "POST /v1/transactions",
      "POST /v1/reviews",
      "POST /v1/disputes"
    ]
  },
  {
    title: "Analytics",
    items: [
      "GET /v1/leaderboard"
    ]
  },
  {
    title: "API Keys & Billing",
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

export default function ApiDocsPage() {
  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 1100 }}>
      <p>
        <a href="/">Back to dashboard</a>
      </p>

      <h1>TrustLayer API Docs</h1>
      <p>
        Developer reference for the Phase 1 TrustLayer API contract. Download
        the OpenAPI YAML and use it with Postman, Swagger, Redoc, or client
        generation tools.
      </p>

      <section style={{ marginTop: 24, padding: 20, border: "1px solid #ddd" }}>
        <h2>OpenAPI Contract</h2>
        <p>
          The canonical API contract is versioned in <code>api-spec/openapi.yaml</code>.
        </p>
        <p>
          <a href="/api/openapi" target="_blank" rel="noreferrer">
            View / download OpenAPI YAML
          </a>
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Endpoint Groups</h2>
        <div style={{ display: "grid", gap: 16 }}>
          {sections.map((section) => (
            <article key={section.title} style={{ padding: 20, border: "1px solid #ddd" }}>
              <h3>{section.title}</h3>
              <ul>
                {section.items.map((item) => (
                  <li key={item}>
                    <code>{item}</code>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 24, padding: 20, border: "1px solid #ddd" }}>
        <h2>Authentication</h2>
        <p>
          Most <code>/v1/*</code> routes require an API key using the
          <code> X-API-Key</code> header. Stripe webhook routes are public and
          verified separately by Stripe webhook signature.
        </p>
      </section>

      <section style={{ marginTop: 24, padding: 20, border: "1px solid #ddd" }}>
        <h2>Example Request</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>
{`curl -X POST https://api.trustlayer.io/v1/verify \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: tl_live_..." \\
  -d '{"subjectId":"sub_123","method":"GHANA_CARD","nationalId":"***"}'`}
        </pre>
      </section>
    </main>
  );
}
