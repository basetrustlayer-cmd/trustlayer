import { prisma } from "@trustlayer/database";
import { WebhookDeliveryService } from "./webhook-delivery.js";

const MAX_ATTEMPTS = Number(process.env.WEBHOOK_MAX_ATTEMPTS ?? "5");
const RETRY_INTERVAL_MS = Number(
  process.env.WEBHOOK_RETRY_INTERVAL_MS ?? "60000"
);

function isRetryEnabled(): boolean {
  return process.env.WEBHOOK_RETRY_ENABLED === "true";
}

export async function processWebhookRetries(): Promise<void> {
  const pending = await prisma.webhookDelivery.findMany({
    where: {
      status: {
        in: ["FAILED", "PENDING"]
      },
      attemptCount: {
        lt: MAX_ATTEMPTS
      }
    },
    include: {
      webhook: true
    },
    orderBy: {
      createdAt: "asc"
    },
    take: 100
  });

  const service = new WebhookDeliveryService();

  for (const delivery of pending) {
    try {
      await service.deliver(delivery.webhook.platformId, {
        event: delivery.eventType,
        data: {
          retryOfDeliveryId: delivery.id,
          webhookId: delivery.webhookId,
          attemptCount: delivery.attemptCount
        },
        createdAt: new Date().toISOString()
      });

      await prisma.webhookDelivery.update({
        where: {
          id: delivery.id
        },
        data: {
          attemptCount: delivery.attemptCount + 1
        }
      });
    } catch (error) {
      console.warn("Webhook retry failed", {
        deliveryId: delivery.id,
        error
      });
    }
  }
}

export function startWebhookRetryEngine(): void {
  if (!isRetryEnabled()) {
    console.log("Webhook retry engine disabled");
    return;
  }

  processWebhookRetries().catch((error: unknown) => {
    console.error("Initial webhook retry run failed", error);
  });

  setInterval(() => {
    processWebhookRetries().catch((error: unknown) => {
      console.error("Webhook retry cycle failed", error);
    });
  }, RETRY_INTERVAL_MS);
}
