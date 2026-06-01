import { renderBadge, renderError } from "./badge.js";
import type { TrustScoreResponse, BadgeOptions } from "./badge.js";

const DEFAULT_BASE_URL = "https://api.trustlayer.africa";
const DEFAULT_TTL_MS = 60_000;
const MIN_POLL_MS = 30_000;

async function fetchScore(
  subjectId: string,
  apiKey: string,
  baseUrl: string
): Promise<TrustScoreResponse> {
  const res = await fetch(baseUrl + "/v1/score/" + subjectId, {
    headers: { Authorization: "Bearer " + apiKey }
  });
  if (!res.ok) throw new Error("TrustLayer: " + res.status);
  return res.json();
}

function initWidget(el: HTMLScriptElement): void {
  const subjectId = el.getAttribute("data-subject-id") ?? "";
  const apiKey = el.getAttribute("data-api-key") ?? "";
  const theme = (el.getAttribute("data-theme") ?? "light") as "light" | "dark";
  const size = (el.getAttribute("data-size") ?? "md") as "sm" | "md" | "lg";
  const baseUrl = el.getAttribute("data-base-url") ?? DEFAULT_BASE_URL;

  if (!subjectId || !apiKey) {
    console.warn("TrustLayer widget: data-subject-id and data-api-key are required");
    return;
  }

  const container = document.createElement("div");
  container.setAttribute("data-trustlayer-widget", subjectId);
  el.insertAdjacentElement("afterend", container);

  const options: BadgeOptions = { subjectId, apiKey, theme, size, baseUrl };
  let ttlMs = DEFAULT_TTL_MS;

  async function load(): Promise<void> {
    try {
      const data = await fetchScore(subjectId, apiKey, baseUrl);
      renderBadge(container, data, options);
      const ttlSeconds = data.projectionTtlSeconds;
      if (ttlSeconds) {
        ttlMs = Math.max(ttlSeconds * 1000, MIN_POLL_MS);
      }
    } catch {
      renderError(container, theme);
    }
    setTimeout(load, ttlMs);
  }

  load();
}

(function bootstrap() {
  const scripts = document.querySelectorAll<HTMLScriptElement>("script[data-subject-id]");
  scripts.forEach(initWidget);
})();
