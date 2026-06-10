import type { WebhookEndpoint } from "../domain";

export const mockWebhookEndpoints: WebhookEndpoint[] = [
  {
    id: "webhook_001",
    url: "https://api.example.com/trustlayer/webhooks",
    active: true,
    events: ["verification.approved", "trustscore.updated", "badge.issued"],
    createdAt: "2026-06-01T00:00:00.000Z"
  },
  {
    id: "webhook_002",
    url: "https://sandbox.example.com/webhooks",
    active: true,
    events: ["entity.created", "verification.submitted"],
    createdAt: "2026-06-02T00:00:00.000Z"
  }
];
