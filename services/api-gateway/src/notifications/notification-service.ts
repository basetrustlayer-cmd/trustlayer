import { randomUUID } from "node:crypto";
import { prisma, Prisma } from "@trustlayer/database";
import {
  publishTrustLayerEvent,
  type TrustLayerEventName,
  type TrustLayerEventPayload
} from "../events/event-publisher.js";
import { WebhookDeliveryService } from "../webhooks/webhook-delivery.js";

export type NotificationChannel = "EVENT_BUS" | "WEBHOOK" | "EMAIL" | "IN_APP";

export type NotifyInput = {
  eventName: TrustLayerEventName;
  subjectIds: string[];
  data: Record<string, unknown>;
  topic?: string;
  platformId?: string;
  channels?: NotificationChannel[];
  email?: {
    to: string;
    subject: string;
    body: string;
  };
  inApp?: {
    title: string;
    body: string;
  };
};

export type EmailNotification = {
  to: string;
  subject: string;
  body: string;
};

export type InAppNotification = {
  subjectIds: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

function defaultTopic(): string {
  return process.env.KAFKA_MARKETPLACE_TOPIC ?? "trustlayer.marketplace.events";
}

function defaultChannels(input: NotifyInput): NotificationChannel[] {
  if (input.channels && input.channels.length > 0) {
    return input.channels;
  }

  const channels: NotificationChannel[] = ["EVENT_BUS"];

  if (input.platformId) {
    channels.push("WEBHOOK");
  }

  if (input.email) {
    channels.push("EMAIL");
  }

  if (input.inApp) {
    channels.push("IN_APP");
  }

  return channels;
}

function assertSubjectIds(subjectIds: string[]): void {
  if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
    throw new Error("Notification requires at least one subjectId.");
  }
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function publishNotificationEvent(input: NotifyInput) {
  assertSubjectIds(input.subjectIds);

  const topic = input.topic ?? defaultTopic();
  const payload: TrustLayerEventPayload = {
    id: randomUUID(),
    eventName: input.eventName,
    subjectIds: input.subjectIds,
    occurredAt: new Date().toISOString(),
    data: input.data
  };

  await prisma.eventLog.create({
    data: {
      eventId: payload.id,
      topic,
      eventName: payload.eventName,
      payload: asJson(payload),
      status: "RECEIVED"
    }
  });

  await publishTrustLayerEvent(topic, payload);

  return payload;
}

export async function sendEmailNotification(input: EmailNotification) {
  if (!input.to.trim()) {
    throw new Error("Email notification requires a recipient.");
  }

  if (!input.subject.trim()) {
    throw new Error("Email notification requires a subject.");
  }

  if (!input.body.trim()) {
    throw new Error("Email notification requires a body.");
  }

  if (process.env.EMAIL_PROVIDER !== "console") {
    console.log("Email notification queued", {
      to: input.to,
      subject: input.subject
    });

    return {
      status: "QUEUED",
      provider: process.env.EMAIL_PROVIDER ?? "unconfigured"
    };
  }

  console.log("Email notification", input);

  return {
    status: "SENT",
    provider: "console"
  };
}

export async function createInAppNotification(input: InAppNotification) {
  assertSubjectIds(input.subjectIds);

  if (!input.title.trim()) {
    throw new Error("In-app notification requires a title.");
  }

  if (!input.body.trim()) {
    throw new Error("In-app notification requires a body.");
  }

  const eventId = randomUUID();
  const payload = {
    id: eventId,
    eventName: "notification.in_app.created",
    subjectIds: input.subjectIds,
    occurredAt: new Date().toISOString(),
    data: {
      title: input.title,
      body: input.body,
      ...(input.data ?? {})
    }
  };

  await prisma.eventLog.create({
    data: {
      eventId,
      topic: "trustlayer.notifications",
      eventName: "notification.in_app.created",
      payload: asJson(payload),
      status: "PROCESSED",
      processedAt: new Date()
    }
  });

  return payload;
}

export async function notify(input: NotifyInput) {
  const channels = defaultChannels(input);
  const results: Record<string, unknown> = {};

  if (channels.includes("EVENT_BUS")) {
    results.eventBus = await publishNotificationEvent(input);
  }

  if (channels.includes("WEBHOOK")) {
    if (!input.platformId) {
      throw new Error("Webhook notification requires platformId.");
    }

    const webhookService = new WebhookDeliveryService();

    await webhookService.deliver(input.platformId, {
      event: input.eventName,
      data: input.data,
      createdAt: new Date().toISOString()
    });

    results.webhook = {
      status: "DELIVERY_ATTEMPTED",
      platformId: input.platformId
    };
  }

  if (channels.includes("EMAIL")) {
    if (!input.email) {
      throw new Error("Email notification requires email payload.");
    }

    results.email = await sendEmailNotification(input.email);
  }

  if (channels.includes("IN_APP")) {
    if (!input.inApp) {
      throw new Error("In-app notification requires inApp payload.");
    }

    results.inApp = await createInAppNotification({
      subjectIds: input.subjectIds,
      title: input.inApp.title,
      body: input.inApp.body,
      data: input.data
    });
  }

  return {
    channels,
    results
  };
}
