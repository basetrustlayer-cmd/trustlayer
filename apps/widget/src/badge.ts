export interface TrustScoreResponse {
  subjectId: string;
  score: number;
  consumerTier: "UNVERIFIED" | "BASIC" | "VERIFIED" | "ENHANCED";
  verificationTier: "UNVERIFIED" | "INDIVIDUAL" | "BUSINESS" | "ENHANCED";
  projectionTtlSeconds?: number;
  lastCalculatedAt: string;
}

export interface BadgeOptions {
  subjectId: string;
  apiKey: string;
  theme: "light" | "dark";
  size: "sm" | "md" | "lg";
  baseUrl: string;
}

const TIER_COLORS: Record<string, string> = {
  UNVERIFIED: "#9ca3af",
  BASIC:      "#60a5fa",
  VERIFIED:   "#34d399",
  ENHANCED:   "#a78bfa"
};

const TIER_LABELS: Record<string, string> = {
  UNVERIFIED: "Unverified",
  BASIC:      "Basic",
  VERIFIED:   "Verified",
  ENHANCED:   "Enhanced"
};

const SIZE_PX: Record<string, { width: number; height: number; font: number }> = {
  sm: { width: 140, height: 40,  font: 11 },
  md: { width: 180, height: 52,  font: 13 },
  lg: { width: 220, height: 64,  font: 15 }
};

export function renderBadge(
  container: HTMLElement,
  data: TrustScoreResponse,
  options: BadgeOptions
): void {
  const { theme, size } = options;
  const { width, height, font } = SIZE_PX[size] ?? SIZE_PX.md;
  const tier = data.consumerTier;
  const color = TIER_COLORS[tier] ?? TIER_COLORS.UNVERIFIED;
  const label = TIER_LABELS[tier] ?? tier;
  const bg = theme === "dark" ? "#1f2937" : "#ffffff";
  const textColor = theme === "dark" ? "#f9fafb" : "#111827";
  const border = theme === "dark" ? "#374151" : "#e5e7eb";
  const verified = data.verificationTier !== "UNVERIFIED";

  container.innerHTML = [
    "<div style=\"display:inline-flex;align-items:center;gap:8px;",
    "background:" + bg + ";border:1px solid " + border + ";border-radius:8px;",
    "padding:0 12px;width:" + width + "px;height:" + height + "px;",
    "font-family:-apple-system,BlinkMacSystemFont,sans-serif;",
    "box-shadow:0 1px 3px rgba(0,0,0,0.08);box-sizing:border-box;\">",
    "<div style=\"width:10px;height:10px;border-radius:50%;background:" + color + ";flex-shrink:0;\"></div>",
    "<div style=\"display:flex;flex-direction:column;min-width:0;\">",
    "<span style=\"font-size:" + font + "px;font-weight:600;color:" + textColor + ";white-space:nowrap;\">",
    label + (verified ? " \u2713" : ""),
    "</span>",
    "<span style=\"font-size:" + (font - 2) + "px;color:" + color + ";font-weight:500;\">",
    "Score " + data.score,
    "</span></div>",
    "<div style=\"margin-left:auto;font-size:9px;color:" + border + ";font-weight:700;\">TL</div>",
    "</div>"
  ].join("");
}

export function renderError(container: HTMLElement, theme: "light" | "dark"): void {
  const bg = theme === "dark" ? "#1f2937" : "#ffffff";
  const border = theme === "dark" ? "#374151" : "#e5e7eb";
  container.innerHTML = [
    "<div style=\"display:inline-flex;align-items:center;gap:6px;",
    "background:" + bg + ";border:1px solid " + border + ";border-radius:8px;",
    "padding:0 12px;height:40px;font-size:11px;color:#9ca3af;\">",
    "TrustLayer unavailable",
    "</div>"
  ].join("");
}
