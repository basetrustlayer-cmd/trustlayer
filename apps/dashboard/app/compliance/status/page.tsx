export default function ComplianceStatusPage() {
  return (
    <main
      style={{
        padding: 40,
        fontFamily: "Arial, sans-serif",
        maxWidth: 860
      }}
    >
      <h1>Compliance Status</h1>
      <p>
        Compliance status tracking is not part of the current TrustLayer MVP.
      </p>
      <p>
        TrustLayer is focused on identity verification, TrustScore APIs,
        API keys, and webhook integrations.
      </p>
      <p style={{ marginTop: 24 }}>
        <a href="/">Back to dashboard</a>
      </p>
    </main>
  );
}
