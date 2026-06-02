import { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Trust Profile | TrustLayer",
  description: "Verified trust credential powered by TrustLayer"
};

interface ScoreData {
  value: number;
  tier: string;
  consumerTier: string;
  confidence: number;
  factors: Record<string, number> | null;
  calculatedAt: string;
}

interface ProfileData {
  subjectId: string;
  displayName: string;
  verificationTier: string;
  score: ScoreData | null;
  certifications: Array<{
    id: string;
    type: string;
    issuedAt: string;
    expiresAt: string | null;
  }>;
}

const TIER_COLOR: Record<string, string> = {
  UNVERIFIED: "#9ca3af",
  BASIC:      "#60a5fa",
  VERIFIED:   "#34d399",
  ENHANCED:   "#a78bfa"
};

const TIER_LABEL: Record<string, string> = {
  UNVERIFIED: "Unverified",
  BASIC:      "Basic Trust",
  VERIFIED:   "Verified",
  ENHANCED:   "Enhanced Trust"
};

const VER_TIER_LABEL: Record<string, string> = {
  UNVERIFIED: "No Verification",
  INDIVIDUAL: "Ghana Card Verified",
  BUSINESS:   "Business Registered",
  ENHANCED:   "Financially Enhanced"
};

function scoreDisplay(score: { confidence: number }): {
  showNumeric: boolean;
  qualifier: string | null;
} {
  if (score.confidence >= 0.70) return { showNumeric: true, qualifier: null };
  if (score.confidence >= 0.40) return { showNumeric: true, qualifier: "limited data" };
  return { showNumeric: false, qualifier: null };
}

async function fetchProfile(subjectId: string): Promise<ProfileData | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const res = await fetch(base + "/api/profile/" + subjectId, {
    next: { revalidate: 60 }
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export default async function ProfilePage({
  params
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const profile = await fetchProfile(subjectId);
  if (!profile) notFound();

  const tier = profile.verificationTier;
  const color = TIER_COLOR[profile.score?.consumerTier ?? "UNVERIFIED"] ?? "#9ca3af";
  const display = profile.score ? scoreDisplay(profile.score) : null;
  const shareUrl = "https://trust.trustlayer.africa/profile/" + profile.subjectId;

  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 999, background: color + "22", color, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
            {TIER_LABEL[profile.score?.consumerTier ?? "UNVERIFIED"]}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
            {profile.displayName}
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
            {VER_TIER_LABEL[tier] ?? tier}
          </p>
        </div>

        {profile.score && display && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, border: "1px solid #e5e7eb", marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              {display.showNumeric ? (
                <>
                  <div style={{ fontSize: 72, fontWeight: 800, color, lineHeight: 1 }}>{profile.score.value}</div>
                  <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
                    TrustScore{display.qualifier ? " - " + display.qualifier : ""}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{TIER_LABEL[profile.score.consumerTier]}</div>
                  <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Score withheld - insufficient data</div>
                </>
              )}
            </div>
            {display.showNumeric && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: profile.score.value + "%", background: color, borderRadius: 4 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                  <span>0</span><span>50</span><span>100</span>
                </div>
              </div>
            )}
            {profile.score.factors && Object.keys(profile.score.factors).length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Score Factors</div>
                {Object.entries(profile.score.factors).map(([key, val]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 13, color: "#374151", minWidth: 140, textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</div>
                    <div style={{ flex: 1, height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: (val * 100) + "%", background: color, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", minWidth: 32, textAlign: "right" }}>{Math.round(val * 100)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {profile.certifications.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb", marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Certifications</div>
            {profile.certifications.map((cert) => (
              <div key={cert.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>{cert.type.replace(/_/g, " ")}</div>
                <div style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>Active</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e5e7eb", marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Shareable Link</div>
          <div style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#374151", wordBreak: "break-all", fontFamily: "monospace" }}>
            {shareUrl}
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 12, color: "#9ca3af" }}>
          <div style={{ marginBottom: 4 }}>Powered by <span style={{ fontWeight: 700, color: "#6b7280" }}>TrustLayer</span> - Trust infrastructure for African commerce</div>
          <div>Last updated: {profile.score ? new Date(profile.score.calculatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "No score yet"}</div>
        </div>
      </div>
    </main>
  );
}
