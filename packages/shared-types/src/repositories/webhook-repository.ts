import { mockWebhookEndpoints } from "../mock";
import type { WebhookEndpoint } from "../domain";

export function listWebhookEndpoints(): WebhookEndpoint[] {
  return mockWebhookEndpoints;
}

export function getWebhookEndpointById(
  id: string
): WebhookEndpoint | null {
  return (
    mockWebhookEndpoints.find(
      (endpoint) => endpoint.id === id
    ) ?? null
  );
}

export function listActiveWebhookEndpoints(): WebhookEndpoint[] {
  return mockWebhookEndpoints.filter(
    (endpoint) => endpoint.active
  );
}
