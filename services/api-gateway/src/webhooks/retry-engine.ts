import { prisma } from "@trustlayer/database";
import { WebhookDeliveryService } from "../webhooks/webhook-delivery.js";

const MAX_ATTEMPTS = Number(process.env.WEBHOOK_MAX_ATTEMPTS ?? "5");
const RETRY_INTERVAL_MS = Number(
  process.env.WEBHOOK_RETRY_INTERVAL_MS ?? "60000"
);

function isRetryEnabled(): boolean {
  return process.env.WEBHOOK_RETRY_ENABLED === "true";
}

function shouldRetry(delivery: {
  status: string;
  attemptCount: number;
}): boolean {
  return (
    delivery.status !== "DELIVERED" &&
    delivery.attemptCount < MAX_ATTEMPTS
  );
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
    orderBy: {
      createdAt: "asc"
    },
    take: 100
  });

  for (const delivery of pending) {
    if (!shouldRetry(delivery)) {
      continue;
    }

    try {
      const service = new WebhookDeliveryService();
      await service.deliver(delivery.id);
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
