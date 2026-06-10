import { mockUsageMetrics } from "../mock";
import type { UsageMetric } from "../domain";

export function listUsageMetrics(): UsageMetric[] {
  return mockUsageMetrics;
}

export function getLatestUsageMetric(): UsageMetric | null {
  return mockUsageMetrics[0] ?? null;
}

export function getUsageMetricByPeriod(
  period: string
): UsageMetric | null {
  return (
    mockUsageMetrics.find(
      (metric) => metric.period === period
    ) ?? null
  );
}
