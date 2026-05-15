import { createHmac } from "node:crypto";
import { prisma } from "@trustlayer/database";

export type WebhookEvent = {
  event: string;
  data: unknown;
  createdAt: string;
};

function signPayload(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function computeBackoffMs(attempt: number): number {
  return Math.min(60_000, 2 ** attempt * 1000);
}

export class WebhookDeliveryService {
  async deliver(platformId: string, event: WebhookEvent): Promise<void> {
    const webhooks = await prisma.webhook.findMany({
      where: {
        platformId,
        isActive: true
      }
    });

    for (const webhook of webhooks) {
      const events = Array.isArray(webhook.events)
        ? webhook.events
        : [];

      if (!events.includes(event.event)) {
        continue;
      }

      const payload = JSON.stringify(event);

      // NOTE:
      // secretHash currently stores a hashed secret in production designs.
      // For this scaffold, it is used directly as the HMAC secret placeholder.
      const signature = signPayload(webhook.secretHash, payload);

      const delivery = await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          eventType: event.event,
          status: "PENDING",
          attemptCount: 1
        }
      });

      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-TrustLayer-Signature": signature,
            "X-TrustLayer-Event": event.event
          },
          body: payload
        });

        await prisma.webhookDelivery.update({
          where: {
            id: delivery.id
          },
          data: {
            status: response.ok ? "DELIVERED" : "FAILED",
            responseCode: response.status,
            deliveredAt: response.ok ? new Date() : null
          }
        });

        if (!response.ok) {
          const delay = computeBackoffMs(1);
          console.warn(
            `Webhook delivery failed for ${webhook.id}. Retry suggested in ${delay}ms.`
          );
        }
      } catch {
        await prisma.webhookDelivery.update({
          where: {
            id: delivery.id
          },
          data: {
            status: "FAILED"
          }
        });

        const delay = computeBackoffMs(1);
        console.warn(
          `Webhook delivery exception for ${webhook.id}. Retry suggested in ${delay}ms.`
        );
      }
    }
  }
}
