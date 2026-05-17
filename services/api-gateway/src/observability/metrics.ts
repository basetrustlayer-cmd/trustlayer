export type HttpMetricLabels = {
  method: string;
  route: string;
  statusCode: number;
};

const startedAt = Date.now();
let totalRequests = 0;
let totalErrors = 0;
const requestCounts = new Map<string, number>();
const latencyBucketsMs = [50, 100, 250, 500, 1000, 2500, 5000];
const latencyCounts = new Map<string, number>();

function labelKey(labels: HttpMetricLabels): string {
  return `${labels.method}|${labels.route}|${labels.statusCode}`;
}

function sanitizeRoute(route: string | undefined): string {
  return route && route.length > 0 ? route : "unknown";
}

function formatLabels(labels: Record<string, string | number>): string {
  return Object.entries(labels)
    .map(([key, value]) => `${key}="${String(value).replaceAll('"', '\\"')}"`)
    .join(",");
}

export function recordHttpRequest(
  input: HttpMetricLabels & { durationMs: number }
): void {
  const labels = {
    method: input.method,
    route: sanitizeRoute(input.route),
    statusCode: input.statusCode
  };

  totalRequests += 1;

  if (input.statusCode >= 500) {
    totalErrors += 1;
  }

  const key = labelKey(labels);
  requestCounts.set(key, (requestCounts.get(key) ?? 0) + 1);

  for (const bucket of latencyBucketsMs) {
    if (input.durationMs <= bucket) {
      const bucketKey = `${key}|${bucket}`;
      latencyCounts.set(bucketKey, (latencyCounts.get(bucketKey) ?? 0) + 1);
    }
  }

  const infKey = `${key}|+Inf`;
  latencyCounts.set(infKey, (latencyCounts.get(infKey) ?? 0) + 1);
}

export function renderPrometheusMetrics(): string {
  const lines: string[] = [];

  lines.push("# HELP trustlayer_api_uptime_seconds API gateway uptime in seconds.");
  lines.push("# TYPE trustlayer_api_uptime_seconds gauge");
  lines.push(`trustlayer_api_uptime_seconds ${Math.floor((Date.now() - startedAt) / 1000)}`);

  lines.push("# HELP trustlayer_http_requests_total Total HTTP requests.");
  lines.push("# TYPE trustlayer_http_requests_total counter");
  lines.push(`trustlayer_http_requests_total ${totalRequests}`);

  lines.push("# HELP trustlayer_http_errors_total Total HTTP 5xx responses.");
  lines.push("# TYPE trustlayer_http_errors_total counter");
  lines.push(`trustlayer_http_errors_total ${totalErrors}`);

  lines.push("# HELP trustlayer_http_requests_by_route_total HTTP requests by route.");
  lines.push("# TYPE trustlayer_http_requests_by_route_total counter");

  for (const [key, value] of requestCounts.entries()) {
    const [method, route, statusCode] = key.split("|");
    lines.push(
      `trustlayer_http_requests_by_route_total{${formatLabels({
        method,
        route,
        status_code: statusCode
      })}} ${value}`
    );
  }

  lines.push("# HELP trustlayer_http_request_duration_ms_bucket HTTP request latency buckets in milliseconds.");
  lines.push("# TYPE trustlayer_http_request_duration_ms_bucket histogram");

  for (const [key, value] of latencyCounts.entries()) {
    const [method, route, statusCode, le] = key.split("|");
    lines.push(
      `trustlayer_http_request_duration_ms_bucket{${formatLabels({
        method,
        route,
        status_code: statusCode,
        le
      })}} ${value}`
    );
  }

  return `${lines.join("\n")}\n`;
}
