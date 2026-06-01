import { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "yaml";

export const metadata: Metadata = {
  title: "Scoring Model Governance | TrustLayer",
  description: "TrustLayer Trust Score model — weights, factors, fraud penalties, and governance process"
};

export const dynamic = "force-static";

function loadModel() {
  const path = join(process.cwd(), "../../docs/governance/scoring-model.yaml");
  const raw = readFileSync(path, "utf-8");
  return parse(raw) as Record<string, unknown>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 16px", paddingBottom: 8, borderBottom: "2px solid #e5e7eb" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "8px 12px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontWeight: 600, color: "#374151", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "10px 12px", color: "#374151", fontFamily: typeof cell === "number" ? "monospace" : "inherit" }}>
                  {String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GovernancePage() {
  const model = loadModel() as {
    model: { name: string; version: string; status: string; owner: string; effective_date: string; description: string };
    tiers: { ceilings: Record<string, number> };
    weights: Record<string, number>;
    factor_definitions: Record<string, { description: string; formula?: string; range: number[] }>;
    fraud_penalties: Record<string, number>;
    inactivity_decay: { enabled: boolean; description: string; thresholds: Array<{ days_inactive: number; penalty: number }> };
    confidence: { base: number; adjustments: Record<string, number>; minimum: number; maximum: number };
    score_bands: Record<string, { min: number; max: number }>;
    governance: { review_frequency: string; approval_required_from: string[]; change_control: string[] };
  };

  const { model: meta, tiers, weights, factor_definitions, fraud_penalties, inactivity_decay, confidence, score_bands, governance } = model;

  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 999, background: "#dcfce7", color: "#16a34a", fontWeight: 600, fontSize: 12, marginBottom: 16 }}>
            {meta.status.toUpperCase()}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>
            {meta.name}
          </h1>
          <p style={{ color: "#6b7280", fontSize: 15, margin: "0 0 16px", lineHeight: 1.6 }}>
            {meta.description}
          </p>
          <div style={{ display: "flex", gap: 24, fontSize: 13, color: "#9ca3af" }}>
            <span>Version <strong style={{ color: "#374151" }}>{meta.version}</strong></span>
            <span>Effective <strong style={{ color: "#374151" }}>{meta.effective_date}</strong></span>
            <span>Owner <strong style={{ color: "#374151" }}>{meta.owner}</strong></span>
          </div>
        </div>

        {/* Factor Weights */}
        <Section title="Factor Weights">
          <Table
            headers={["Factor", "Weight", "Percentage"]}
            rows={Object.entries(weights).map(([k, v]) => [
              k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              v,
              (v * 100).toFixed(0) + "%"
            ])}
          />
        </Section>

        {/* Factor Definitions */}
        <Section title="Factor Definitions">
          {Object.entries(factor_definitions).map(([key, def]) => (
            <div key={key} style={{ marginBottom: 16, padding: 16, background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb" }}>
              <div style={{ fontWeight: 600, color: "#111827", marginBottom: 4, textTransform: "capitalize" }}>
                {key.replace(/_/g, " ")}
              </div>
              <div style={{ color: "#6b7280", fontSize: 14, marginBottom: def.formula ? 8 : 0 }}>
                {def.description}
              </div>
              {def.formula && (
                <div style={{ background: "#f9fafb", borderRadius: 6, padding: "6px 10px", fontSize: 13, fontFamily: "monospace", color: "#374151" }}>
                  {def.formula.trim()}
                </div>
              )}
            </div>
          ))}
        </Section>

        {/* Tier Ceilings */}
        <Section title="Verification Tier Score Ceilings">
          <Table
            headers={["Tier", "Score Ceiling"]}
            rows={Object.entries(tiers.ceilings).map(([k, v]) => [k, v])}
          />
        </Section>

        {/* Score Bands */}
        <Section title="Score Band Definitions">
          <Table
            headers={["Band", "Min", "Max"]}
            rows={Object.entries(score_bands).map(([k, v]) => [
              k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              v.min,
              v.max
            ])}
          />
        </Section>

        {/* Fraud Penalties */}
        <Section title="Fraud Penalties">
          <Table
            headers={["Fraud Signal", "Score Penalty"]}
            rows={Object.entries(fraud_penalties).map(([k, v]) => [k.toUpperCase(), v])}
          />
        </Section>

        {/* Inactivity Decay */}
        <Section title="Inactivity Decay Schedule">
          <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>{inactivity_decay.description}</p>
          <Table
            headers={["Days Inactive", "Score Penalty"]}
            rows={inactivity_decay.thresholds.map((t) => [t.days_inactive + "+ days", t.penalty])}
          />
        </Section>

        {/* Confidence */}
        <Section title="Confidence Scoring">
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1, background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>{confidence.base}</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>Base Score</div>
            </div>
            <div style={{ flex: 1, background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>{confidence.minimum}</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>Minimum</div>
            </div>
            <div style={{ flex: 1, background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>{confidence.maximum}</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>Maximum</div>
            </div>
          </div>
          <Table
            headers={["Condition", "Confidence Boost"]}
            rows={Object.entries(confidence.adjustments).map(([k, v]) => [
              k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              "+" + v
            ])}
          />
        </Section>

        {/* Governance */}
        <Section title="Governance Process">
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>Review Frequency</div>
            <div style={{ fontWeight: 600, color: "#111827", textTransform: "capitalize" }}>{governance.review_frequency}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Approval Required From</div>
              {governance.approval_required_from.map((a) => (
                <div key={a} style={{ fontSize: 14, color: "#374151", padding: "4px 0" }}>· {a}</div>
              ))}
            </div>
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Change Control</div>
              {governance.change_control.map((c) => (
                <div key={c} style={{ fontSize: 14, color: "#374151", padding: "4px 0" }}>· {c}</div>
              ))}
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", paddingTop: 24, borderTop: "1px solid #e5e7eb" }}>
          <div>TrustLayer scoring model v{meta.version} — effective {meta.effective_date}</div>
          <div style={{ marginTop: 4 }}>
            Raw YAML available at{" "}
            <a href="/v1/scoring-model.yaml" style={{ color: "#6b7280" }}>/v1/scoring-model.yaml</a>
          </div>
        </div>

      </div>
    </main>
  );
}
